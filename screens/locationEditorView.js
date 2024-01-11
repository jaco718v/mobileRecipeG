import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useContext } from "react";
import { db, storage } from "../components/config";
import { StatusContext } from "../context/context";
import { setDoc, doc, collection } from "firebase/firestore";
import { RadioButton } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useCollection } from "react-firebase-hooks/firestore";
import { getNextId } from "../util/util";
import { ref, uploadBytes } from "firebase/storage";
import { successToast, errorToast } from "../util/util";

const LocationEditorPage = ({ navigation, route }) => {
  const statusContext = useContext(StatusContext);
  const [textGuessValues, textGuessLoading, textGuessError] = useCollection(
    collection(
      db,
      "locationMarkers",
      String(statusContext.accountData.locationId),
      "textGuess"
    )
  );
  const textGuessList = textGuessValues?.docs.map((_doc) => ({
    ..._doc.data(),
    id: _doc.id,
  }));
  const [imageGuessValues, imageGuessLoading, imageGuessError] = useCollection(
    collection(
      db,
      "locationMarkers",
      String(statusContext.accountData.locationId),
      "imageGuess"
    )
  );
  const imageGuessList = imageGuessValues?.docs.map((_doc) => ({
    ..._doc.data(),
    id: _doc.id,
  }));
  const [createType, setCreateType] = useState(true);
  const [enteredRecipeName, setEnteredRecipeName] = useState(null);
  const [ingredientList, setIngredientList] = useState([{ name: "", id: 0 }]);
  const [imageList, setImageList] = useState([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    if (textGuessList && imageGuessList) {
      setNextId(getNextId([...textGuessList, ...imageGuessList]));
    }
  }, [textGuessValues, imageGuessValues]);

  function addIngredientField() {
    if (ingredientList.length < 10) {
      setIngredientList([
        ...ingredientList,
        { name: "", id: ingredientList.length },
      ]);
    }
  }

  function removeImage(id) {
    setImageList([imageList.sort((n) => n.id != id)]);
  }

  function removeIngredient(id) {
    setIngredientList([...ingredientList.filter((n) => n.id != id)]);
  }

  async function submitTextRecipe() {
    if (ingredientList.length > 1 && ingredientList.length < 10) {
      try {
        const ingredientNameList = ingredientList.map((n) => n.name);
        const scoreRef = doc(
          db,
          "locationMarkers",
          String(statusContext.accountData.locationId),
          "textGuess",
          String(nextId)
        );
        await setDoc(scoreRef, {
          ingredients: ingredientNameList,
          name: enteredRecipeName,
        });
        successToast("Recipe saved and uploaded");
        navigation.navigate("mapPage");
      } catch (error) {
        errorToast("Error while saving recipe");
      }
    } else {
      console.log("Size cannot exceed 9 or be less than 2");
    }
  }

  async function submitImageRecipe() {
    if (imageList.length > 2 && imageList.length < 7) {
      try {
        uploadImages();
        const scoreRef = doc(
          db,
          "locationMarkers",
          String(statusContext.accountData.locationId),
          "imageGuess",
          String(nextId)
        );
        await setDoc(scoreRef, {
          numberOfImages: imageList.length,
          name: enteredRecipeName,
        });
        successToast("Recipe saved and uploaded");
        navigation.navigate("mapPage");
      } catch (error) {
        errorToast("Error while saving recipe");
      }
    } else {
      console.log("Size cannot exceed 6 or be less than 3");
    }
  }

  async function uploadImages() {
    let counter = 0;
    for (let image of imageList) {
      const res = await fetch(image.uri);
      const blob = await res.blob();
      const locationId = statusContext.accountData.locationId;
      const storageRef = ref(
        storage,
        `ingredient-${locationId}-${nextId}-${counter++}.jpg`
      );
      uploadBytes(storageRef, blob).then((snapshot) => {
        console.log("image uploaded");
      });
    }
  }

  async function useCamera() {
    if (imageList.length < 7) {
      const result = await ImagePicker.requestCameraPermissionsAsync();
      if (result.granted === false) {
        alert("No camera access");
      }
      ImagePicker.launchCameraAsync()
        .then((response) => {
          if (!response.canceled) {
            setImageList([
              ...imageList,
              { uri: response.assets[0].uri, id: imageList.length },
            ]);
          }
        })
        .catch((error) => errorToast("Error using camera"));
    }
  }

  async function launchImagePicker() {
    if (imageList.length < 7) {
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
      });
      if (!result.canceled) {
        setImageList([
          ...imageList,
          { uri: result.assets[0].uri, id: imageList.length },
        ]);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a new recipe quiz</Text>

      <View style={styles.radios}>
        <RadioButton
          value="Text-based Quiz"
          status={createType ? "checked" : "unchecked"}
          onPress={() => setCreateType(true)}
        />
        <Text style={styles.radiosText}>Text-based</Text>
        <RadioButton
          value="Image-based Quiz"
          status={createType ? "unchecked" : "checked"}
          onPress={() => setCreateType(false)}
        />
        <Text style={styles.radiosText}>Image-based</Text>
      </View>

      <TextInput
        placeholder="Enter recipe name"
        style={styles.input}
        onChangeText={(newText) => setEnteredRecipeName(newText)}
        value={enteredRecipeName}
      />

      {createType && (
        <>
          <View style={styles.createBox}>
            <TouchableOpacity
              onPress={addIngredientField}
              style={styles.buttonSmall}
            >
              <Text>Add ingredient</Text>
            </TouchableOpacity>

            {ingredientList.map((ingredient, i) => (
              <View style={styles.inputRow} key={ingredient.id}>
                <TextInput
                  placeholder="Ingredient name"
                  style={styles.input}
                  onChangeText={(newText) =>
                    setIngredientList(
                      ingredientList.map((n) =>
                        n.id === ingredient.id ? { ...n, name: newText } : n
                      )
                    )
                  }
                  value={ingredient.name}
                />
                <TouchableOpacity
                  style={styles.buttonX}
                  onPress={() => removeIngredient(ingredient.id)}
                >
                  <Text style={{ left: 6 }}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      {!createType && (
        <>
          <Text style={styles.infoText}>Tab image to delete</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={useCamera} style={styles.button}>
              <Text>Use Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={launchImagePicker} style={styles.button}>
              <Text>Select File</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageRow}>
            {imageList.map((image) => (
              <View key={image.id}>
                <TouchableOpacity onPress={() => removeImage(image.id)}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imgStyle}
                  ></Image>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={createType ? submitTextRecipe : submitImageRecipe}
      >
        <Text>Finish recipe quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LocationEditorPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#a1e0e9",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    fontFamily: "sans-serif-condensed",
    fontSize: 24,
    textAlign: "center",
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },

  radios: {
    flexDirection: "row",
  },
  radiosText: {
    top: 6,
  },
  createBox: {
    top: 30,
  },
  inputRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
    margin: 1,
    width: 200,
  },
  button: {
    backgroundColor: "#2293bb",
    padding: 5,
    width: 160,
    borderRadius: 8,
    borderColor: "black",
    borderWidth: 2,
    margin: 5,
    top: 40,
  },
  buttonSmall: {
    backgroundColor: "grey",
    padding: 3,
    width: 130,
    borderRadius: 8,
    borderColor: "black",
    borderWidth: 2,
    margin: 3,
    left: 50,
    bottom: 5,
  },
  buttonX: {
    height: 31,
    width: 26,
    borderRadius: 8,
    borderColor: "black",
    borderWidth: 2,
    backgroundColor: "grey",
    textAlign: "center",
    justifyContent: "center",
    margin: 3,
  },
  buttonRow: {
    flexDirection: "row",
  },
  infoText: {
    top: 35,
  },
  imageRow: {
    alignItems: "normal",
    flexDirection: "row",
    height: 200,
    top: 40,
    flexWrap: "wrap",
  },
  imgStyle: {
    height: 90,
    width: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
    padding: 10,
  },
});
