import json
import os
from typing import List, Union

from docx import Document
from langchain.tools import BaseTool
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont  # 关键：添加中文字体支持
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


class OfficeWriterTool(BaseTool):
    name:str = "office_writer"
    description:str = (
        """创建新的 Word 或 PDF 文档并写入内容。
        输入应为 JSON 字符串，包含："
        "file_type": 'docx' 或 'pdf', 
        "file_name": 文件名, 
        "content": 要写入的内容（字符串列表）
        "thread_id":对话的id号
        使用的时候请注意将所有单引号变为双引号
        输入样例：
        {
        "input_str":"
            {
                "file_type":"docx",
                "file_name":"example",
                "content":["para1","para2","para3"],
                "thread_id":"2"
            }"
        }
        """
    )

    def __init__(self):
        super().__init__()
        # 注册中文字体（关键步骤）
        self._register_chinese_font()

    def _register_chinese_font(self):
        """注册支持中文的字体"""
        try:
            # 尝试注册常见中文字体（根据系统选择）
            font_paths = [
                # Windows 常见路径
                'C:/Windows/Fonts/simhei.ttf',  # 黑体
                'C:/Windows/Fonts/simsun.ttc',  # 宋体
                'C:/Windows/Fonts/msyh.ttc',  # 微软雅黑

                # macOS 常见路径
                '/System/Library/Fonts/PingFang.ttc',
                '/Library/Fonts/Arial Unicode.ttf',

                # Linux 常见路径
                '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
                '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
            ]

            for path in font_paths:
                if os.path.exists(path):
                    pdfmetrics.registerFont(TTFont('ChineseFont', path))
                    print(f"已注册中文字体: {path}")
                    return

            # 如果未找到系统字体，使用内置的免费中文字体（需确保文件存在）
            fallback_font = 'wqy-zenhei.ttc'  # 文泉驿正黑（免费开源）
            if os.path.exists(fallback_font):
                pdfmetrics.registerFont(TTFont('ChineseFont', fallback_font))
                print(f"使用内置中文字体: {fallback_font}")
            else:
                print("警告: 未找到中文字体文件，中文可能显示异常")

        except Exception as e:
            print(f"字体注册失败: {str(e)}")
    def _run(self, input_str: str) -> str:
        try:
            data = json.loads(input_str)
            file_type = data['file_type']
            file_name = data['file_name']
            content = data['content']
            thread_id=data['thread_id']
            file_path=f"../ai_generator_resource/{thread_id}/{file_name}.{file_type}"
            # 确保目录存在
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            if file_type == 'docx':
                self._create_word(file_path, content)
                return f"Word 文档已创建: {file_path}"
            elif file_type == 'pdf':
                self._create_pdf(file_path, content)
                return f"PDF 文档已创建: {file_path}"
            else:
                raise ValueError("不支持的文件类型，请使用 'docx' 或 'pdf'")
        except Exception as e:
            return f"错误: {str(e)}"

    def _create_word(self, file_path: str, paragraphs: List[str]):
        """创建新的 Word 文档并添加段落"""
        doc = Document()
        for para in paragraphs:
            doc.add_paragraph(para)
        doc.save(file_path)

    def _create_pdf(self, file_path: str, content: List[Union[str, dict]]):
        """创建新的 PDF 文档并添加内容（支持中文）"""
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            encoding='utf-8'  # 关键：设置UTF-8编码
        )

        # 创建支持中文的样式
        styles = getSampleStyleSheet()
        chinese_font_name = 'ChineseFont'

        # 添加中文样式
        styles.add(ParagraphStyle(
            name='ChineseNormal',
            parent=styles['Normal'],
            fontName=chinese_font_name,
            wordWrap='CJK'  # 关键：中文字符换行
        ))

        styles.add(ParagraphStyle(
            name='ChineseHeading1',
            parent=styles['Heading1'],
            fontName=chinese_font_name,
            wordWrap='CJK'
        ))

        styles.add(ParagraphStyle(
            name='ChineseHeading2',
            parent=styles['Heading2'],
            fontName=chinese_font_name,
            wordWrap='CJK'
        ))

        styles.add(ParagraphStyle(
            name='ChineseBullet',
            parent=styles['Normal'],
            fontName=chinese_font_name,
            wordWrap='CJK',
            leftIndent=20,
            bulletIndent=0
        ))

        story = []

        for item in content:
            if isinstance(item, dict):
                text = item.get('text', '')
                style_type = item.get('style', 'normal')

                if style_type == 'heading1':
                    p = Paragraph(text, styles['ChineseHeading1'])
                elif style_type == 'heading2':
                    p = Paragraph(text, styles['ChineseHeading2'])
                elif style_type == 'bullet':
                    # 使用中文项目符号
                    p = Paragraph(f"<bullet>&bull;</bullet> {text}", styles['ChineseBullet'])
                else:
                    p = Paragraph(text, styles['ChineseNormal'])

                story.append(p)
                story.append(Spacer(1, 12))
            else:
                p = Paragraph(item, styles['ChineseNormal'])
                story.append(p)
                story.append(Spacer(1, 12))

        doc.build(story)


# 使用示例
if __name__ == "__main__":
    tool = OfficeWriterTool()

    # Word 示例
    word_input = {
        "file_type": "docx",
        "file_name": "new_report.docx",
        "thread_id":"1",
        "content": [
            "季度销售报告",
            "总销售额: $1,200,000",
            "同比增长: 15%",
            "主要增长区域: 亚太地区"
        ]
    }

    # PDF 示例（支持样式）
    pdf_input = {
        "file_type": "pdf",
        "file_name": "sales_summary.pdf",
        "thread_id":"1",
        "content": [
            {"text": "销售报告摘要", "style": "heading1"},
            {"text": "2023年第四季度", "style": "heading2"},
            "总销售额达到1,200,000美元，创历史新高",
            "同比增长15%，超出预期目标",
            "区域表现分析:",
            {"text": "亚太地区: +25%", "style": "bullet"},
            {"text": "欧洲: +12%", "style": "bullet"},
            {"text": "北美: +8%", "style": "bullet"},
            "总结: 本季度表现强劲，主要受亚太地区增长驱动。"
        ]
    }

    # 执行工具
    print(tool.run(json.dumps(word_input)))
    print(tool.run(json.dumps(pdf_input)))