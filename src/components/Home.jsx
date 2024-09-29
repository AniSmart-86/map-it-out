import React, { useEffect, useState, useRef, useMemo } from 'react';
import './home.css';
import { Circle, DirectionsRenderer, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Spinner } from './Spinner';


const mapContainerStyle = {
  height: '85vh',
  width: '100%',
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
};




const API_KEY = import.meta.env.VITE_APP_MAP_API_KEY;

const Home = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedType, setSelectedType] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const serviceRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: ['places'],
  });

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(regions)'], // Allow searching for cities, regions, etc.
      });
      autocompleteRef.current.addListener('place_changed', onPlaceChanged);
    }
  }, [isLoaded]);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry && place.geometry.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setCurrentLocation(location);
      setMapCenter(location);
      mapRef.current.panTo(location);

      
      if (place.formatted_address) {
        const formattedAddress = place.formatted_address.replace(/,/g, ' '); 
        setSearchQuery(formattedAddress);
      } else if (place.name) {
        setSearchQuery(place.name); 
      }

      
      const bounds = place.geometry.viewport || null;

      
      fetchPlaces(selectedType, formattedAddress || place.name, bounds);
    } else {
      alert('Place not found');
    }
  };

  useEffect(() => {
    if (isLoaded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setMapCenter(location);
         
          fetchPlaces(selectedType);
          console.log(currentLocation);
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          const defaultLocation = { lat: 37.7749, lng: -122.4194 }; 
          setCurrentLocation(defaultLocation);
          setMapCenter(defaultLocation);
          fetchPlaces(selectedType);
        }
      );
    }
  }, [isLoaded]);

  const fetchPlaces = (type, searchQuery = '', bounds = null) => {
    if (!mapRef.current || !type) return; 

    if (!serviceRef.current) {
      serviceRef.current = new window.google.maps.places.PlacesService(mapRef.current);
    }

    const request = {
      bounds: bounds,
      query: searchQuery ? `${searchQuery} ${type}` : type, 
    };

    serviceRef.current.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPlaces(results);
      } else {
        console.error('Places fetch failed:', status);
        setPlaces([]);
      }
    });
  };


  useEffect(()=>{

    const fetchDirections = async ()=>{
      
      const service = new google.maps.DirectionsService();



    await  service.route(
        {
          origin: currentLocation,
          destination: hospitals,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) =>{
          if(status === "OK" && result){
            setDirections(result);
          }
        }
      )
    }
    fetchDirections();
  }, [])
  



  const handleTypeChange = (label) => {
    let type = '';

    
    switch (label) {
      case 'Hospital':
        type = 'hospital';
        break;
      case 'School':
        type = 'school';
        break;
      case 'Police Station':
        type = 'police';
        break;
      case 'Fire Station':
        type = 'fire_station';
        break;
      default:
        type = label.toLowerCase(); 
    }

    setSelectedType(label); 

    if (searchQuery) {
    
      fetchPlaces(type, searchQuery);
    } else if (currentLocation) {
      
      fetchPlaces(type);
    }
  };

  if (!isLoaded) {
    return <div className="loading">
      <Spinner />
      </div>
  }

 

  return (
    <div className="container">
      <div className="left-container">
        <h2>Location Made Easy</h2>
        <div className="search-location">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search for location"
              ref={inputRef}
              value={searchQuery} // Controlled input value
              onChange={(e) => setSearchQuery(e.target.value)} // Manually update the searchQuery
            />
          </div>
          <button
            onClick={() => handleTypeChange('Hospital')}
            className={`btn ${selectedType === 'Hospital' ? 'active' : ''}`}
          >
            Hospital
          </button>
          <button
            onClick={() => handleTypeChange('School')}
            className={`btn ${selectedType === 'School' ? 'active' : ''}`}
          >
            School
          </button>
          <button
            onClick={() => handleTypeChange('Police Station')}
            className={`btn ${selectedType === 'Police Station' ? 'active' : ''}`}
          >
            Police Station
          </button>
          <button
            onClick={() => handleTypeChange('Fire Station')}
            className={`btn ${selectedType === 'Fire Station' ? 'active' : ''}`}
          >
            Fire Station
          </button>
        </div>
      
      </div>
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={mapCenter}
          options={options}
          onLoad={(map) => {
            mapRef.current = map;
            serviceRef.current = new window.google.maps.places.PlacesService(map);
          }}
        >
           {directions && (
            <DirectionsRenderer directions={directions} />)}
         
          {currentLocation && (
          <>
            <Marker
              position={currentLocation}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
             
            />
           
          
             <Circle center={currentLocation}
              radius={400} options={closeOptions}/>
             <Circle center={currentLocation}
              radius={700} options={middleOptions}/>
             <Circle center={currentLocation}
              radius={1000} options={farOptions}/>
             
          </>
          )}
          {places.map((place) => (
            <Marker
              key={place.place_id}
              position={{
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }}
              title={place.name}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
};

export default Home;



const defaultOptions = {
  strokeOpacity: 0.5,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
};

const closeOptions ={
  ...defaultOptions,
  zIndex: 3,
  fillOpacity: 0.05,
  strokeColor: "#8BC34A",
  fillColor: "#8BC34A"
};

const middleOptions ={
  ...defaultOptions,
  zIndex: 2,
  fillOpacity: 0.05,
  strokeColor: "#FBC02D",
  fillColor: "#FBC02D"
};

const farOptions ={
  ...defaultOptions,
  zIndex: 1,
  fillOpacity: 0.05,
  strokeColor: "#FF5252",
  fillColor: "#FF5252"
};



