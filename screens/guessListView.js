import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db, storage } from "../components/config";
import * as ImagePicker from "expo-image-picker";
import { StatusContext } from "../context/context";
import { useState, useEffect, useContext } from "react";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { successToast, errorToast } from "../util/util";
import { useCollection } from "react-firebase-hooks/firestore";

const GuessListPage = ({ navigation, route }) => {
  const statusContext = useContext(StatusContext);
  const [difficulty, setDifficulty] = useState(true);
  const [scoreValues, scoreLoading, scoreError] = useCollection(
    collection(
      db,
      "users",
      statusContext.currentUser.uid,
      "history",
      String(statusContext.locationData.id),
      "scores"
    )
  );
  const scoreList = scoreValues?.docs.map((_doc) => ({
    ..._doc.data(),
    id: _doc.id,
  }));
  const [textGuessValues, textGuessLoading, textGuessError] = useCollection(
    collection(
      db,
      "locationMarkers",
      String(statusContext.locationData.id),
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
      String(statusContext.locationData.id),
      "imageGuess"
    )
  );
  const imageGuessList = imageGuessValues?.docs.map((_doc) => ({
    ..._doc.data(),
    id: _doc.id,
  }));
  const [scoredTextList, setScoredTextList] = useState([]);
  const [scoredImageList, setScoredImageList] = useState([]);
  const [imagePath, setImagePath] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const list = difficulty ? scoredTextList : scoredImageList;

  useEffect(() => {
    if (textGuessList && imageGuessList) {
      if (scoreList) {
        setScoredTextList(
          [...textGuessList].map((n) => matchRecipeScore(scoreList, n))
        );
        setScoredImageList(
          [...imageGuessList].map((n) => matchRecipeScore(scoreList, n))
        );
      } else {
        setScoredTextList(
          [...textGuessList].map((n) => matchRecipeScore([], n))
        );
        setScoredImageList(
          [...imageGuessList].map((n) => matchRecipeScore([], n))
        );
      }
    }
  }, [scoreValues, textGuessValues, imageGuessValues]);

  function matchRecipeScore(scores, guessRecipe) {
    const scoreIndex = scores.findIndex((n) => n.id === guessRecipe.id);
    if (scoreIndex != -1) {
      return {
        ...guessRecipe,
        score: scores[scoreIndex].score,
        hasImage: scores[scoreIndex].hasImage,
        taken: true,
      };
    } else {
      return { ...guessRecipe, score: 0, taken: false };
    }
  }

  async function useCamera(recipe) {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if (result.granted === false) {
      errorToast("Camera does not have permission");
    }
    ImagePicker.launchCameraAsync()
      .then((response) => {
        if (!response.canceled) {
          uploadImage(response.assets[0].uri, recipe);
        }
      })
      .catch((error) => errorToast("Camera encountered an error"));
  }

  async function uploadImage(image, recipe) {
    const res = await fetch(image);
    const blob = await res.blob();
    const userId = statusContext.currentUser.uid;
    const locationId = statusContext.locationData.id;
    const storageRef = ref(
      storage,
      `meal-${userId}-${locationId}-${recipe.id}.jpg`
    );
    uploadBytes(storageRef, blob).then((snapshot) => {
      updateHasImage(recipe);
      successToast("Image successfully uploaded");
    });
  }

  async function updateHasImage(recipe) {
    await updateDoc(
      doc(
        db,
        "users",
        statusContext.currentUser.uid,
        "history",
        String(statusContext.locationData.id),
        "scores",
        String(recipe.id)
      ),
      {
        hasImage: true,
        score: recipe.score + 30,
      }
    ).catch((error) => {
      errorToast("Error in updating score");
    });
    const userRef = doc(db, "users", statusContext.currentUser.uid);
    await updateDoc(userRef, {
      totalScore: statusContext.accountData.totalScore + 30,
    }).catch((error) => {
      errorToast("Error in updating score");
    });
    statusContext.accountData.totalScore =
    statusContext.accountData.totalScore + _score;
  }

  async function downloadAndDisplayImage(recipeId) {
    const userId = statusContext.currentUser.uid;
    const locationId = statusContext.locationData.id;
    getDownloadURL(ref(storage, `meal-${userId}-${locationId}-${recipeId}.jpg`))
      .then((url) => {
        setImagePath(url);
        setShowImage(true);
      })
      .catch((error) => {
        errorToast("Error in download");
      });
  }

  return (
    <View style={styles.container}>
      <View style={showImage ? styles.fadedContainer : null}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setDifficulty(true)}
          >
            <Text style={difficulty ? styles.active : null}>Text</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setDifficulty(false)}
          >
            <Text style={difficulty ? null : styles.active}>Image</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={list}
          renderItem={(recipe) => (
            <View style={styles.listRow}>
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  if (!recipe.item.score)
                    difficulty
                      ? navigation.navigate("guessTextPage", {
                          guessContent: recipe.item,
                        })
                      : navigation.navigate("guessImagePage", {
                          guessContent: recipe.item,
                        });
                }}
              >
                <Text>{recipe.item.name}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row" }}>
                {recipe.item.taken && (
                  <>
                    <AntDesign
                      name={recipe.item.hasImage ? "camera" : "camerao"}
                      onPress={
                        recipe.item.hasImage
                          ? () => downloadAndDisplayImage(recipe.item.id)
                          : () => useCamera(recipe.item)
                      }
                      size={16}
                    />
                  </>
                )}

                <MaterialIcons
                  name={recipe.item.score >= 50 ? "star" : "star-border"}
                  size={16}
                />
                <MaterialIcons
                  name={recipe.item.score >= 80 ? "star" : "star-border"}
                  size={16}
                />
                <MaterialIcons
                  name={recipe.item.score >= 110 ? "star" : "star-border"}
                  size={16}
                />
              </View>
            </View>
          )}
        />
      </View>
      {showImage && (
        <>
          <View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.imageBox}
              onPress={() => setShowImage(false)}
            >
              <Image source={{ uri: imagePath }} style={styles.imageStyle} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default GuessListPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#a1e0e9",
    // justifyContent: 'center',
  },
  imageContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    padding: 40,
    justifyContent: "center",
    opacity: 1,
  },
  imageStyle: {
    height: 250,
    width: 250,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
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
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },
  buttonRow: {
    flexDirection: "row",
    borderTopLeftRadius: 10,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "black",
    height: 35,
    padding: 5,
  },
  imageBox: {
    height: "100%",
    width: "100%",
  },
  fadedContainer: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#fff",
    justifyContent: "center",
    opacity: 0.2,
  },
  active: {
    color: "blue",
  },
});
