from typing import Any, Optional, Dict

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import Checkpoint, CheckpointMetadata, ChannelVersions

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver


class AsyncStartEndCheckpointer(AsyncSqliteSaver):

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        await super().adelete_thread(thread_id=config["configurable"]["thread_id"])
        await super().aput(config=config, checkpoint=checkpoint, metadata=metadata, new_versions=new_versions)