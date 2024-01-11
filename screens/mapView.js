import MapView, { Marker } from "react-native-maps";
import { useState, useRef, useEffect, useContext } from "react";
import {
  getDocs,
  collection,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import * as Location from "expo-location";
import { db } from "../components/config";
import { StatusContext } from "../context/context";
import {
  TouchableOpacity,
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { getNextId } from "../util/util";
import { useCollection } from "react-firebase-hooks/firestore";
import { successToast, errorToast } from "../util/util";

const MapPage = ({ navigation, route }) => {
  const statusContext = useContext(StatusContext);
  const [values, loading, error] = useCollection(
    collection(db, "locationMarkers")
  );
  const markers = values?.docs.map((_doc) => ({ ..._doc.data(), id: _doc.id }));
  const [markerData, setMarkerData] = useState(null);
  const [showLocation, setShowLocation] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationDesc, setLocationDesc] = useState("");
  const [region, setRegion] = useState({
    latitude: 55,
    longitude: 12,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });

  const mapView = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    async function startListening() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        errorToast("Denied access to gps");
        return;
      }
      locationSubscription.current = await Location.watchPositionAsync(
        {
          distanceInterval: 100,
          accuracy: Location.Accuracy.High,
        },
        (location) => {
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(newRegion);
          if (mapView.current) {
            mapView.current.animateToRegion(newRegion);
          }
        }
      );
    }
    startListening();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  function addMarker(data) {
    const { latitude, longitude } = data.nativeEvent.coordinate;
    const markerData = {
      coordinate: { latitude, longitude },
      key: data.timeStamp,
    };
    setMarkerData(markerData);
    setShowCreate(true);
  }

  async function createLocation() {
    const newMarker = {
      ...markerData,
      locationName: locationName,
      locationDesc: locationDesc,
    };
    let newId = getNextId(markers);
    try {
      await setDoc(doc(db, "locationMarkers", String(newId)), {
        ...newMarker,
      });
      await updateDoc(doc(db, "users", statusContext.currentUser.uid), {
        locationId: newId,
      });
      statusContext.setAccountData({
        ...statusContext.accountData,
        locationId: newId,
      });
      successToast("Location successfully created");
    } catch (error) {
      errorToast("Encountered an error while creating location");
    }
  }

  function onMarkerPressed(locationData) {
    setShowLocation(true);
    setLocationName(locationData.locationName);
    setLocationDesc(locationData.locationDesc);
    statusContext.setLocationData({ ...locationData });
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onLongPress={(event) => {
          if (
            statusContext.accountData.type === true &&
            !statusContext.accountData.locationId
          )
            addMarker(event);
        }}
      >
        {markers &&
          markers.map((marker) => (
            <Marker
              coordinate={marker.coordinate}
              key={marker.key}
              title={marker.locationName}
              onPress={() => onMarkerPressed(marker)}
            />
          ))}
      </MapView>

      <View style={styles.optionBar}>
        {statusContext.accountData.type === false && (
          <>
            <Text style={styles.optionText}>Welcome</Text>
            <Text style={styles.optionText}>
              Account-score: {statusContext.accountData.totalScore}
            </Text>
          </>
        )}

        {statusContext.accountData.type === true && (
          <>
            <Text
              style={styles.optionText}
              onPress={() => {
                if (statusContext.accountData.locationId)
                  navigation.navigate("locationEditorPage");
              }}
            >
              Create recipes
            </Text>
          </>
        )}

        {statusContext.accountData.type === null && (
          <>
            <Text style={styles.optionText}>
              Log in to unlock additional feaures
            </Text>
          </>
        )}
      </View>

      {showCreate && (
        <>
          <View style={styles.infoBox}>
            <View style={styles.infoText}>
              <TextInput
                placeholder="Enter name of location"
                style={styles.topText}
                onChangeText={(newText) => setLocationName(newText)}
                value={locationName}
              />

              <TextInput
                placeholder="Enter a description of your location"
                style={styles.bottomText}
                multiline={true}
                numberOfLines={4}
                onChangeText={(newText) => setLocationDesc(newText)}
                value={locationDesc}
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowCreate(!showCreate)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={createLocation}>
                <Text>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {showLocation && (
        <>
          <View style={styles.infoBox}>
            <View style={styles.infoText}>
              <Text style={styles.topText}>{locationName}</Text>

              <Text
                multiline={true}
                numberOfLines={3}
                style={styles.bottomText}
              >
                {locationDesc}
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity>
                <Text
                  style={styles.button}
                  onPress={() => setShowLocation(!showLocation)}
                >
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity>
                {statusContext.accountData.type === false && (
                  <>
                    <Text
                      style={styles.button}
                      onPress={() => navigation.navigate("guessListPage")}
                    >
                      Open
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export default MapPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  optionBar: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    height: "5%",
    width: "100%",
    backgroundColor: "#a9c1c8",
    top: 0,
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },
  infoBox: {
    position: "absolute",
    height: "40%",
    width: "100%",
    bottom: 0,
    backgroundColor: "#5D98CB",
  },
  infoText: {
    flex: 4,
  },
  button: {
    backgroundColor: "#a9c1c8",
    padding: 5,
    height: 45,
    width: 170,
    textAlign: "center",
    borderTopColor: "black",
    borderTopWidth: 1,
    borderRightColor: "black",
    borderRightWidth: 1,
  },
  buttonRow: {
    flex: 1,
    flexDirection: "row",
    borderTopLeftRadius: 10,
  },
  optionText: {
    margin: 3,
    paddingLeft: 10,
    paddingRight: 10,
  },
  topText: {
    borderTopColor: "black",
    borderTopWidth: 1,
    backgroundColor: "#8FC992",
    padding: 3,
  },
  bottomText: {
    borderTopColor: "black",
    borderTopWidth: 1,
    padding: 3,
  },
});
