from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class PyObjectId(str):
    """
    Custom type to handle MongoDB ObjectId as a plain string.
    Allows ObjectId fields to serialize cleanly in JSON responses.
    """

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _info=None):
        from bson import ObjectId
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return v
            raise ValueError(f"Invalid ObjectId: {v}")
        raise TypeError(f"ObjectId or str required, got {type(v)}")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)


def serialize_doc(doc: dict) -> dict:
    """
    Convert a raw MongoDB document to a JSON-serializable dict.
    - Converts _id (ObjectId) to string id field
    - Removes the raw _id field
    """
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


def serialize_docs(docs: list) -> list:
    """
    Serialize a list of MongoDB documents.
    """
    return [serialize_doc(doc) for doc in docs]


class BaseResponse(BaseModel):
    """
    Standard API response wrapper.
    """
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Any] = None


class PaginationParams(BaseModel):
    """
    Reusable pagination parameters.
    """
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    def get_skip(self) -> int:
        return (self.page - 1) * self.limit