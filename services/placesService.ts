
import { GeoLocation, AddressContext } from "../types";

/**
 * Helper to prevent infinite hanging.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
};

/**
 * Parses Google Geocoder components into a clean AddressContext object.
 * UPDATED: Heavy fallback logic to extract State/District from string if components fail.
 */
const parseAddressComponents = (components: any[], formattedAddress: string): AddressContext => {
    const getComponent = (type: string) => components.find(c => c.types.includes(type))?.long_name || "";
    
    let street = getComponent("route") || getComponent("street_address") || getComponent("sublocality") || "Road";
    let city = getComponent("locality") || getComponent("administrative_area_level_2") || getComponent("postal_town");
    let district = getComponent("administrative_area_level_2");
    let state = getComponent("administrative_area_level_1");
    let country = getComponent("country") || "India";
    let postalCode = getComponent("postal_code");

    // --- FALLBACK LOGIC: PARSE FORMATTED STRING ---
    // Google often skips 'administrative_area_level_1' in rural India.
    // Format usually: "Street, Area, City, State Pincode, Country"
    if (!state || state === "") {
        const parts = formattedAddress.split(',').map(s => s.trim());
        const len = parts.length;
        
        if (len >= 3) {
            // Usually the part before Country (last) containing numbers is Pincode+State
            // Example: "Vizianagaram, Andhra Pradesh 535002, India"
            // parts[len-1] = India
            // parts[len-2] = Andhra Pradesh 535002
            
            let statePart = parts[len - 2];
            
            // Remove Pincode numbers from State string
            statePart = statePart.replace(/[0-9]/g, '').trim();
            
            // Clean up basic abbreviations
            if (statePart.includes("Andhra")) state = "Andhra Pradesh";
            else if (statePart.includes("Telangana")) state = "Telangana";
            else if (statePart.includes("Tamil")) state = "Tamil Nadu";
            else if (statePart.includes("Karnataka")) state = "Karnataka";
            else if (statePart.includes("Maharashtra")) state = "Maharashtra";
            else state = statePart;
        }
    }

    // Fix District if missing (use City)
    if (!district) district = city;
    // Fix City if missing (use District)
    if (!city) city = district;

    // Final Fallback
    if (!state) state = "Unknown State";
    if (!district) district = "Unknown District";

    return {
        street: String(street),
        city: String(city),
        district: String(district),
        state: String(state),
        country: String(country),
        postalCode: String(postalCode),
        formattedAddress: String(formattedAddress || "")
    };
};

/**
 * Main function to gather all location intelligence and structured address data.
 */
export const getLocationIntelligence = async (location: GeoLocation | null): Promise<{ promptContext: string, address: AddressContext | null }> => {
  if (!location) return { promptContext: "GPS Signal Missing. Rely on visual cues only.", address: null };
  if (!window.google || !window.google.maps) return { promptContext: "Maps API not loaded.", address: null };

  const geocoder = new window.google.maps.Geocoder();
  const placesServiceNode = document.createElement('div');
  const placesService = new window.google.maps.places.PlacesService(placesServiceNode);

  // 1. Geocoding Promise (Gets Address & Road Type)
  const geocodePromise = new Promise<{ context: string, address: AddressContext | null }>((resolve) => {
      try {
        geocoder.geocode({ location: { lat: location.lat, lng: location.lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const types = results[0].types;
                const isRoad = types.some(t => 
                    ['route', 'street_address', 'intersection', 'highway', 'premise'].includes(t)
                );
                
                const addressData = parseAddressComponents(results[0].address_components, results[0].formatted_address);
                
                const contextStr = isRoad 
                    ? `Verified Road Network: ${results[0].formatted_address} (Type: ${types.join(', ')})` 
                    : `Location Context: ${results[0].formatted_address} (Type: ${types.join(', ')} - WARNING: MAY NOT BE A ROAD)`;
                
                resolve({ context: contextStr, address: addressData });
            } else {
                resolve({ context: "Geocoding returned no clear results.", address: null });
            }
        });
      } catch (e) {
          resolve({ context: "Geocoding error occurred.", address: null });
      }
  });

  // 2. Places Search Promise (Gets Sensitive Zones)
  const placesPromise = new Promise<string>((resolve) => {
    const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: 200,
        keyword: "school hospital bus_station market" 
    };

    try {
        placesService.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const uniquePlaces = results.slice(0, 3).map(p => `${p.name} (${p.types?.[0]})`).join(", ");
                resolve(`Nearby Sensitive Zones: ${uniquePlaces}`);
            } else {
                resolve("No immediate sensitive zones detected nearby.");
            }
        });
    } catch (e) {
        resolve("Places API Error.");
    }
  });

  try {
    const [geoResult, placesContext] = await Promise.all([
      withTimeout(geocodePromise, 7000, { context: "Geocoding Timeout", address: null }),
      withTimeout(placesPromise, 7000, "Sensitive Zone Timeout")
    ]);

    const finalPrompt = `
    --- REAL-WORLD MAPS DATA (SOURCE: GOOGLE PLACES API) ---
    GPS: ${location.lat}, ${location.lng}
    ADDRESS_STATE: ${geoResult.address?.state || "Unknown"}
    ADDRESS_DISTRICT: ${geoResult.address?.district || "Unknown"}
    1. ROAD CHECK: ${geoResult.context}
    2. NEARBY PLACES: ${placesContext}
    --------------------------------------------------------
    `;

    return { promptContext: finalPrompt, address: geoResult.address };

  } catch (e) {
    return { promptContext: "Map Data Context Unavailable.", address: null };
  }
};
