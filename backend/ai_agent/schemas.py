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
    district: Optional[str] = Field(
        None, description="District key if the user names a district rather than a town, e.g. 'gampaha', 'nuwara_eliya'."
    )
    zip_code: Optional[str] = Field(None, description='5-digit ZIP code if mentioned.')
    min_price: Optional[int] = Field(None, description='Minimum price in LKR: monthly rent for rentals, sale price when buying.')
    max_price: Optional[int] = Field(None, description='Maximum price / budget in LKR: monthly rent for rentals, sale price when buying.')
    min_beds: Optional[int] = Field(None, description='Minimum number of bedrooms.')
    min_baths: Optional[float] = Field(None, description='Minimum number of bathrooms.')
    home_type: Optional[Literal['house', 'apartment', 'annex', 'land', 'upper_floor_house', 'shop', 'commercial']] = Field(
        None, description='Type of home, if the user specified one. Annexes and upper floor houses are rentals only.'
    )
    max_key_money_months: Optional[int] = Field(
        None, ge=0, le=12, description="Rentals only: most months of rent the user will pay as key money, 0-12."
    )
    max_advance: Optional[int] = Field(None, description='Buying only: largest advance (deposit) in LKR the user can pay.')
    min_parking: Optional[int] = Field(None, description='Minimum number of parking slots.')
    min_sqft: Optional[int] = Field(None, description='Minimum floor area in square feet.')
    max_sqft: Optional[int] = Field(None, description='Maximum floor area in square feet.')
    stories: Optional[Literal[1, 2, 3]] = Field(None, description='Number of stories, if the user asked for one.')
    furnishing: Optional[Literal['furnished', 'unfurnished']] = Field(None, description='Furnished or unfurnished, if the user said.')
    shared_bathroom: Optional[bool] = Field(None, description='False if the user wants a private bathroom, True if a shared one is fine/wanted.')
    min_land_size: Optional[float] = Field(None, description='Smallest land size, in land_unit.')
    max_land_size: Optional[float] = Field(None, description='Largest land size, in land_unit.')
    land_unit: Optional[Literal['perch', 'acre']] = Field(None, description="Unit of min/max_land_size: 'perch' (default) or 'acre'.")
    deed_type: Optional[Literal['sinnakkara', 'bimsaviya', 'jayabhoomi', 'swarnabhoomi', 'permit', 'leasehold', 'other']] = Field(
        None, description='Land for sale: the deed (title) type the user asked for, e.g. sinnakkara (freehold).'
    )
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
    price: int = Field(description='LKR, digits only: the monthly rent, or the sale price if the property is for sale.')
    beds: int
    baths: float
    sqft: Optional[int] = Field(None, description='Floor area in square feet, if given.')
    land_size: Optional[float] = Field(None, description='Land size, if given (not for apartments).')
    land_unit: Literal['perch', 'acre'] = Field('perch', description="Unit of land_size: 'perch' or 'acre'.")
    home_type: Literal['house', 'apartment', 'annex', 'land', 'upper_floor_house', 'shop', 'commercial'] = 'house'
    status: Literal['for_sale', 'for_rent'] = 'for_rent'
    key_money_months: int = Field(0, ge=0, le=12, description="Rentals: key money as a number of months' rent, 0-12. 0 if none.")
    advance_amount: Optional[int] = Field(None, description='Sales: the advance (deposit) asked from the buyer, in LKR, if given.')
    parking_slots: int = 0
    shared_bathroom: bool = Field(False, description='True if the only bathroom is shared with others.')
    stories: Optional[Literal[1, 2, 3]] = Field(None, description='Number of stories; leave blank for land.')
    furnishing: Literal['furnished', 'unfurnished'] = 'unfurnished'
    description: str = Field(description='A polished 2-4 sentence marketing description.')
    year_built: Optional[int] = None
    primary_image_url: Optional[str] = Field(
        None, description='A photo URL if one was included in the source text, else leave blank.'
    )
