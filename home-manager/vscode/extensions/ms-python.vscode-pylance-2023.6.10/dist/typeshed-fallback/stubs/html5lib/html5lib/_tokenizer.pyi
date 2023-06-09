from _typeshed import Incomplete
from typing import Any

entitiesTrie: Any
attributeMap = dict

class HTMLTokenizer:
    stream: Any
    parser: Any
    escapeFlag: bool
    lastFourChars: Any
    state: Any
    escape: bool
    currentToken: Any
    def __init__(self, stream, parser: Incomplete | None = None, **kwargs) -> None: ...
    tokenQueue: Any
    def __iter__(self): ...
    def consumeNumberEntity(self, isHex): ...
    def consumeEntity(self, allowedChar: Incomplete | None = None, fromAttribute: bool = False) -> None: ...
    def processEntityInAttribute(self, allowedChar) -> None: ...
    def emitCurrentToken(self) -> None: ...
    def dataState(self): ...
    def entityDataState(self): ...
    def rcdataState(self): ...
    def characterReferenceInRcdata(self): ...
    def rawtextState(self): ...
    def scriptDataState(self): ...
    def plaintextState(self): ...
    def tagOpenState(self): ...
    def closeTagOpenState(self): ...
    def tagNameState(self): ...
    temporaryBuffer: str
    def rcdataLessThanSignState(self): ...
    def rcdataEndTagOpenState(self): ...
    def rcdataEndTagNameState(self): ...
    def rawtextLessThanSignState(self): ...
    def rawtextEndTagOpenState(self): ...
    def rawtextEndTagNameState(self): ...
    def scriptDataLessThanSignState(self): ...
    def scriptDataEndTagOpenState(self): ...
    def scriptDataEndTagNameState(self): ...
    def scriptDataEscapeStartState(self): ...
    def scriptDataEscapeStartDashState(self): ...
    def scriptDataEscapedState(self): ...
    def scriptDataEscapedDashState(self): ...
    def scriptDataEscapedDashDashState(self): ...
    def scriptDataEscapedLessThanSignState(self): ...
    def scriptDataEscapedEndTagOpenState(self): ...
    def scriptDataEscapedEndTagNameState(self): ...
    def scriptDataDoubleEscapeStartState(self): ...
    def scriptDataDoubleEscapedState(self): ...
    def scriptDataDoubleEscapedDashState(self): ...
    def scriptDataDoubleEscapedDashDashState(self): ...
    def scriptDataDoubleEscapedLessThanSignState(self): ...
    def scriptDataDoubleEscapeEndState(self): ...
    def beforeAttributeNameState(self): ...
    def attributeNameState(self): ...
    def afterAttributeNameState(self): ...
    def beforeAttributeValueState(self): ...
    def attributeValueDoubleQuotedState(self): ...
    def attributeValueSingleQuotedState(self): ...
    def attributeValueUnQuotedState(self): ...
    def afterAttributeValueState(self): ...
    def selfClosingStartTagState(self): ...
    def bogusCommentState(self): ...
    def markupDeclarationOpenState(self): ...
    def commentStartState(self): ...
    def commentStartDashState(self): ...
    def commentState(self): ...
    def commentEndDashState(self): ...
    def commentEndState(self): ...
    def commentEndBangState(self): ...
    def doctypeState(self): ...
    def beforeDoctypeNameState(self): ...
    def doctypeNameState(self): ...
    def afterDoctypeNameState(self): ...
    def afterDoctypePublicKeywordState(self): ...
    def beforeDoctypePublicIdentifierState(self): ...
    def doctypePublicIdentifierDoubleQuotedState(self): ...
    def doctypePublicIdentifierSingleQuotedState(self): ...
    def afterDoctypePublicIdentifierState(self): ...
    def betweenDoctypePublicAndSystemIdentifiersState(self): ...
    def afterDoctypeSystemKeywordState(self): ...
    def beforeDoctypeSystemIdentifierState(self): ...
    def doctypeSystemIdentifierDoubleQuotedState(self): ...
    def doctypeSystemIdentifierSingleQuotedState(self): ...
    def afterDoctypeSystemIdentifierState(self): ...
    def bogusDoctypeState(self): ...
    def cdataSectionState(self): ...
