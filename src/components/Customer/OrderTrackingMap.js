import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { locationService } from '../../services/locationService';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const restaurantIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4287/4287725.png', // Restaurant Building icon
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/610/610120.png', // Previously restaurant icon (Chef Hat)
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

// Component to handle map centering and bounds
const MapRefresher = ({ restaurantCoords, userCoords, driverCoords, status }) => {
    const map = useMap();

    useEffect(() => {
        const bounds = [];
        if (restaurantCoords) bounds.push(restaurantCoords);
        if (userCoords) bounds.push(userCoords);
        if (driverCoords && ['picked', 'nearby'].includes(status)) bounds.push(driverCoords);

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [restaurantCoords, userCoords, driverCoords, status, map]);

    return null;
};

const OrderTrackingMap = ({ order }) => {
    const [restaurantCoords, setRestaurantCoords] = useState(null);
    const [userCoords, setUserCoords] = useState(null);
    const [driverCoords, setDriverCoords] = useState(null);
    const [isResolving, setIsResolving] = useState(true);

    useEffect(() => {
        const resolveStaticLocations = async () => {
            if (!order) return;
            setIsResolving(true);

            // Resolve Restaurant Location (using name + "Addis Ababa" as hint)
            const rCoords = await locationService.resolveCoordinates(order.restaurantName || 'Addis Ababa');
            setRestaurantCoords([rCoords.lat, rCoords.lng]);

            // Resolve User Location
            const uCoords = await locationService.resolveCoordinates(order.deliveryAddress || 'Addis Ababa');
            setUserCoords([uCoords.lat, uCoords.lng]);

            setIsResolving(false);
        };

        resolveStaticLocations();
    }, [order?.restaurantName, order?.deliveryAddress]);

    useEffect(() => {
        if (!order || !restaurantCoords || !userCoords) return;

        if (order.status === 'picked') {
            // Simulate driver starting at restaurant and moving halfway to user
            setDriverCoords([
                (restaurantCoords[0] + userCoords[0]) / 2,
                (restaurantCoords[1] + userCoords[1]) / 2
            ]);
        } else if (order.status === 'nearby') {
            // Simulate driver near user
            setDriverCoords([
                userCoords[0] + (restaurantCoords[0] - userCoords[0]) * 0.1,
                userCoords[1] + (restaurantCoords[1] - userCoords[1]) * 0.1
            ]);
        } else if (order.status === 'delivered') {
            setDriverCoords(userCoords);
        } else {
            setDriverCoords(null);
        }
    }, [order?.status, restaurantCoords, userCoords]);

    if (!order || isResolving || !restaurantCoords || !userCoords) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center bg-light" style={{ height: '400px', borderRadius: '20px' }}>
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <small className="text-muted">Locating markers...</small>
            </div>
        );
    }

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '20px', overflow: 'hidden', zIndex: 1 }}>
            <MapContainer center={restaurantCoords} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Restaurant Marker */}
                <Marker position={restaurantCoords} icon={restaurantIcon}>
                    <Popup>
                        <strong>{order.restaurantName || 'Restaurant'}</strong><br />
                        Preparing your order
                    </Popup>
                </Marker>

                {/* User Marker */}
                <Marker position={userCoords} icon={userIcon}>
                    <Popup>
                        <strong>Delivery Address</strong><br />
                        {order.deliveryAddress}
                    </Popup>
                </Marker>

                {/* Driver Marker */}
                {driverCoords && ['picked', 'nearby', 'delivered'].includes(order.status) && (
                    <Marker position={driverCoords} icon={driverIcon}>
                        <Popup>
                            <strong>Delivery Driver</strong><br />
                            {order.status === 'picked' ? 'On the way to you!' :
                                order.status === 'nearby' ? 'Almost there!' : 'Arrived!'}
                        </Popup>
                    </Marker>
                )}

                {/* Draw Route Line */}
                <Polyline
                    positions={[restaurantCoords, userCoords]}
                    color="rgba(16, 163, 127, 0.4)"
                    dashArray="10, 10"
                />

                <MapRefresher
                    restaurantCoords={restaurantCoords}
                    userCoords={userCoords}
                    driverCoords={driverCoords}
                    status={order.status}
                />
            </MapContainer>
        </div>
    );
};

export default OrderTrackingMap;
