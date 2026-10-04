"""Pydantic schemas used with ChatAnthropic's structured-output mode
(llm.with_structured_output(Schema)) so Claude's replies come back as typed,
validated data instead of text we'd have to parse ourselves.
"""
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PropertySearchFilters(BaseModel):
    """Mirrors properties.filters.PropertyFilter's query params.

    Every field is optional — Claude fills in only what the user's sentence
    actually implies (e.g. "3 bed annex in Kandy under 60,000 rupees, furnished").
    """

    city: Optional[str] = Field(None, description="Sri Lankan city name if mentioned, e.g. 'Colombo'.")
    zip_code: Optional[str] = Field(None, description='5-digit ZIP code if mentioned.')
    min_price: Optional[int] = Field(None, description='Minimum monthly rent in Sri Lankan rupees (LKR).')
    max_price: Optional[int] = Field(None, description='Maximum monthly rent / budget ceiling in Sri Lankan rupees (LKR).')
    min_beds: Optional[int] = Field(None, description='Minimum number of bedrooms.')
    min_baths: Optional[float] = Field(None, description='Minimum number of bathrooms.')
    home_type: Optional[Literal['house', 'apartment', 'annex', 'land', 'upper_floor_house', 'shop']] = Field(
        None, description='Type of home, if the user specified one.'
    )
    max_key_money_months: Optional[int] = Field(
        None, ge=0, le=12, description="Most months of rent the user will pay as key money (advance), 0-12."
    )
    min_parking: Optional[int] = Field(None, description='Minimum number of parking slots.')
    min_sqft: Optional[int] = Field(None, description='Minimum floor area in square feet.')
    max_sqft: Optional[int] = Field(None, description='Maximum floor area in square feet.')
    stories: Optional[Literal[1, 2, 3]] = Field(None, description='Number of stories, if the user asked for one.')
    furnishing: Optional[Literal['furnished', 'unfurnished']] = Field(None, description='Furnished or unfurnished, if the user said.')
    status: Optional[Literal['for_sale', 'for_rent']] = Field(
        None, description="'for_rent' if the user is looking to rent, 'for_sale' if buying."
    )
    search: Optional[str] = Field(
        None, description='Freeform keyword to match against address/city/state/zip as a fallback.'
    )


class ListingDraft(BaseModel):
    """Mirrors properties.models.Property, for extracting a listing from raw pasted text."""

    address: str = Field(description='Street address.')
    city: str
    state: str = Field(description='Two-letter state code, e.g. TX.')
    zip_code: str
    price: int = Field(description='Monthly rent in Sri Lankan rupees (LKR), digits only.')
    beds: int
    baths: float
    sqft: int
    home_type: Literal['house', 'apartment', 'annex', 'land', 'upper_floor_house', 'shop'] = 'house'
    status: Literal['for_sale', 'for_rent'] = 'for_rent'
    key_money_months: int = Field(0, ge=0, le=12, description="Key money (advance) as a number of months' rent, 0-12. 0 if none.")
    parking_slots: int = 0
    stories: Optional[Literal[1, 2, 3]] = Field(None, description='Number of stories; leave blank for land.')
    furnishing: Literal['furnished', 'unfurnished'] = 'unfurnished'
    description: str = Field(description='A polished 2-4 sentence marketing description.')
    year_built: Optional[int] = None
    primary_image_url: Optional[str] = Field(
        None, description='A photo URL if one was included in the source text, else leave blank.'
    )
