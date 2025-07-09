from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolNode

from backed_end.service.state.state import State


class CustomToolNode(ToolNode):
    def __init__(self, tools):
        super().__init__(tools)

    def run(self, state: State) -> State:
        # 获取最后一条消息（应该是包含tool_calls的助手消息）
        last_message = state["messages"][-1]

        if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
            return {"messages": []}

        # 执行工具调用
        tool_responses = []
        for tool_call in last_message.tool_calls:
            tool = next((t for t in self.tools if t.name == tool_call["name"]), None)
            if tool:
                try:
                    output = tool.invoke(tool_call["args"])
                    tool_responses.append(ToolMessage(
                        content=str(output),
                        tool_call_id=tool_call["id"],
                        name=tool_call["name"]
                    ))
                except Exception as e:
                    tool_responses.append(ToolMessage(
                        content=f"Tool error: {str(e)}",
                        tool_call_id=tool_call["id"],
                        name=tool_call["name"]
                    ))
        # 返回工具响应消息
        return {"messages": tool_responses}
