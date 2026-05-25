export interface AddressResponse {
  street: string;
  ward: string;
  city: CityResponse;
}

export interface CityResponse {
  cityId: number;
  cityName: string;
}
