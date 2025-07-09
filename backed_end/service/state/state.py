from typing import List, Annotated

from langchain_core.messages import BaseMessage, AIMessage
from typing_extensions import TypedDict

def custom_state_updater(old_state, new_state):
    print("new state:",new_state)
    if(isinstance(new_state[0], AIMessage)):
        if("Answer" in new_state[0].content):
            return new_state
    return old_state+new_state

class State(TypedDict):
    messages: Annotated[List,custom_state_updater]

