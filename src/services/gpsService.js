// GPS and location tracking service
export const gpsService = {
  // Get current location
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let errorMessage = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  },

  // Watch location changes (for delivery tracking)
  watchLocation: (callback, errorCallback) => {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation is not supported'));
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000 // 30 seconds
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed,
          heading: position.coords.heading
        });
      },
      (error) => {
        errorCallback(error);
      },
      options
    );

    return watchId;
  },

  // Stop watching location
  stopWatching: (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = gpsService.toRadians(lat2 - lat1);
    const dLon = gpsService.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(gpsService.toRadians(lat1)) * Math.cos(gpsService.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // Distance in kilometers
  },

  // Convert degrees to radians
  toRadians: (degrees) => {
    return degrees * (Math.PI / 180);
  },

  // Calculate estimated delivery time based on distance
  calculateDeliveryTime: (distance, trafficFactor = 1.2) => {
    // Assume average speed of 25 km/h in city traffic
    const averageSpeed = 25;
    const timeInHours = (distance * trafficFactor) / averageSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    
    // Minimum 10 minutes, maximum 60 minutes
    return Math.max(10, Math.min(60, timeInMinutes));
  },

  // Get address from coordinates (reverse geocoding)
  getAddressFromCoordinates: async (latitude, longitude) => {
    try {
      // Using a free geocoding service (in production, use Google Maps API or similar)
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return {
          success: true,
          address: data.results[0].formatted,
          components: data.results[0].components
        };
      } else {
        return {
          success: false,
          error: 'No address found for these coordinates'
        };
      }
    } catch (error) {
      console.error('Error getting address:', error);
      return {
        success: false,
        error: error.message,
        // Fallback address
        address: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    }
  },

  // Get coordinates from address (geocoding)
  getCoordinatesFromAddress: async (address) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=YOUR_API_KEY`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formatted_address: result.formatted
        };
      } else {
        return {
          success: false,
          error: 'Address not found'
        };
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Check if delivery person is near destination
  isNearDestination: (currentLat, currentLon, destLat, destLon, thresholdKm = 0.5) => {
    const distance = gpsService.calculateDistance(currentLat, currentLon, destLat, destLon);
    return distance <= thresholdKm;
  },

  // Generate route between two points (simplified)
  generateRoute: async (startLat, startLon, endLat, endLon) => {
    try {
      // In production, use Google Maps Directions API or similar
      // This is a simplified version
      const distance = gpsService.calculateDistance(startLat, startLon, endLat, endLon);
      const estimatedTime = gpsService.calculateDeliveryTime(distance);
      
      return {
        success: true,
        distance: distance,
        estimatedTime: estimatedTime,
        route: [
          { lat: startLat, lng: startLon },
          { lat: endLat, lng: endLon }
        ]
      };
    } catch (error) {
      console.error('Error generating route:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Real-time delivery tracking
  trackDelivery: {
    // Start tracking delivery
    startTracking: (orderId, deliveryPersonId, callback) => {
      const watchId = gpsService.watchLocation(
        (location) => {
          // Update location in database
          gpsService.updateDeliveryLocation(orderId, deliveryPersonId, location);
          
          // Call callback with location update
          if (callback) {
            callback(location);
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
        }
      );

      return watchId;
    },

    // Update delivery location in database
    updateDeliveryLocation: async (orderId, deliveryPersonId, location) => {
      try {
        // In production, this would update Firestore with real-time location
        const locationData = {
          orderId,
          deliveryPersonId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
          accuracy: location.accuracy,
          speed: location.speed
        };

        // Update in Firestore (implement with your database service)
        console.log('Updating delivery location:', locationData);
        
        return { success: true };
      } catch (error) {
        console.error('Error updating delivery location:', error);
        return { success: false, error: error.message };
      }
    },

    // Stop tracking delivery
    stopTracking: (watchId) => {
      gpsService.stopWatching(watchId);
    }
  }
};

export default gpsService;