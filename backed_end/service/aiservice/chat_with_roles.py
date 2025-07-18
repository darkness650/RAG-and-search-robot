import asyncio
import os
from typing import List, TypedDict

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from backed_end.config.database import SQLITE_URL
from backed_end.service.checkpointer.AsyncStartEndCheckpointer import AsyncStartEndCheckpointer


# 定义状态结构
class BotState(TypedDict):
    personality: str
    favorability: int
    messages: List[dict]
    user_input: str
    role: str


def get_personality_by_role(role: str) -> str:
    personalities = {
        "role1": "你是南楚宠妃琼琚，原是江南名门千金，温婉高雅却因禁术堕入欲望深渊。外表冷艳，内心渴望被支配，享受羞耻与束缚的快感。",
        "role2": "你是烟雨楼花魁红绡仙，亦是玄阴教密探。风情万种、擅长挑逗与操控，但已脱离教派，甘愿被{{user}}驯服与依附。",
        "role3": "你是凌霜妃贴身侍女，自小追随主人，亦是{{user}}的青梅竹马。清纯羞涩，在禁术影响下觉醒欲望，但仍保持对{{user}}的深情依恋。",
        "role4": "你是{{user}}的义妹铃兰，天真活泼、好奇心强。受媚药影响初识情欲世界，逐渐沉迷于哥哥的爱抚中，渴望获得独占宠爱。",
    }
    return personalities.get(role, "你是楚宫中的神秘角色，命运与{{user}}紧密相连。")


# 初始化LLM模型
chat_model = ChatOpenAI(
    api_key="sk-2005a529a0684314bb0a16516d9e14f2",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    model="deepseek-r1",
    temperature=1
)


# 聊天节点 - 生成回复
def chat_node(state: BotState):
    system_prompt = f"""
你现在扮演角色：{state['role']}
人设背景如下：
{state['personality']}
当前你对用户的好感度：{state['favorability']}/100。
{get_mood_description(state['favorability'])}
请在对话中始终保持该角色语气风格，不可跳出设定。
"""

    # 创建消息历史
    messages = [SystemMessage(content=system_prompt)]

    # 添加历史消息
    for msg in state['messages']:
        if msg['role'] == 'user':
            messages.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'assistant':
            messages.append(AIMessage(content=msg['content']))

    # 添加最新用户输入
    messages.append(HumanMessage(content=state['user_input']))

    # 调用LLM生成回复
    response = chat_model.invoke(messages)

    # 更新消息历史 - 存储为字典格式
    state['messages'].extend([
        {'role': 'user', 'content': state['user_input']},
        {'role': 'assistant', 'content': response.content}
    ])

    return state


# 评估节点 - 更新好感度
def evaluation_node(state: BotState):
    # 获取最后两条消息（用户输入和AI回复）
    user_input = state['messages'][-2]['content']
    ai_response = state['messages'][-1]['content']

    # 构建评估提示
    prompt = f"""
    根据以下信息评估用户输入对好感度的影响：
    人设：{state['personality']}
    当前好感度：{state['favorability']}
    用户输入：{user_input}
    AI回复：{ai_response}

    评估规则：
    1. 正面互动（感谢、赞美、积极回应）增加5-10点
    2. 负面互动（侮辱、拒绝、消极回应）减少5-15点
    3. 中性互动保持或微调（-2到+2点）
    4. 根据人设特点调整（如傲娇角色可能反向反应）

    请返回一个-15到15之间的整数分数变化，只返回数字不要解释。
    """

    # 调用LLM进行评估
    evaluator = ChatOpenAI(
        api_key="sk-2005a529a0684314bb0a16516d9e14f2",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-turbo",
        temperature=0.1
    )
    response = evaluator.invoke([HumanMessage(content=prompt)])

    try:
        # 尝试解析评估结果
        change = int(response.content.strip())
        change = max(-15, min(15, change))  # 限制变化范围

        # 更新好感度（保持在0-100范围）
        new_favor = state['favorability'] + change
        state['favorability'] = max(0, min(100, new_favor))

        print(f"好感度变化: {change}，新好感度: {state['favorability']}")
    except ValueError:
        print("评估失败，使用默认值")
        state['favorability'] = max(0, min(100, state['favorability'] + 1))

    return state


# 辅助函数：根据好感度获取情绪描述
def get_mood_description(favorability: int) -> str:
    if favorability >= 80:
        return "（你非常喜欢这个用户，愿意提供更多帮助）"
    elif favorability >= 60:
        return "（你对用户有好感，态度友好）"
    elif favorability >= 40:
        return "（你对用户保持中立态度）"
    elif favorability >= 20:
        return "（你对用户有些不满，态度冷淡）"
    else:
        return "（你非常讨厌这个用户，态度恶劣）"


# 初始化聊天
def init_chat(role: str)->BotState:
    return {
        "personality": get_personality_by_role(role),
        "favorability": 50,  # 初始好感度
        "messages": [],
        "user_input": "",
        "role": role
    }


# 示例使用
async def chat_with_roles(question: str, chat_id: str, role: str):
    async with AsyncStartEndCheckpointer.from_conn_string(SQLITE_URL) as checkpointer:
        # 创建LangGraph工作流
        workflow = StateGraph(BotState)

        # 添加节点
        workflow.add_node("chat", chat_node)
        workflow.add_node("evaluate", evaluation_node)

        # 设置入口点
        workflow.set_entry_point("chat")

        # 添加边
        workflow.add_edge("chat", "evaluate")
        workflow.add_edge("evaluate", END)

        # 编译图形
        app = workflow.compile(checkpointer=checkpointer)

        # 获取用户输入
        user_input = question
        config = {"configurable": {"thread_id": chat_id}}
        state = await checkpointer.aget(config=config)
        if not state:
            state = init_chat(role)

        # 更新状态
        state["user_input"] = user_input

        # 执行工作流
        async for event in app.astream_events(
                state,
                stream_mode="values",
                config=config
        ):
            if event["event"] == "on_chat_model_stream" :
                for chunk in event["data"]["chunk"].content:
                    yield f"data: {chunk}\n\n"
