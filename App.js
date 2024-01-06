import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatusContextProvider from './context/context';
import { app } from './components/config';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import  ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

import LoginPage from './screens/loginView';
import SignUpPage from './screens/signUpView';
import MapPage from './screens/mapView';
import GuessListPage from './screens/guessListView';
import GuessTextPage from './screens/guessTextView';
import GuessImagePage from './screens/guessImageView';
import LocationEditorPage from './screens/locationEditorView';

export default function App() {
  const Stack = createNativeStackNavigator();
  
  let auth
  if(Platform.OS === 'web'){
  auth = getAuth(app)
  }else{
  // auth = initializeAuth(app, {
  //     persistence:getReactNativePersistence(ReactNativeAsyncStorage)
  // })
  }

  return (
    <StatusContextProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='locationEditorPage'>
          <Stack.Screen
            name='loginPage'
            component={LoginPage}
          />
          <Stack.Screen
            name='signUpPage'
            component={SignUpPage}
          />
          <Stack.Screen
            name='mapPage'
            component={MapPage}
          />
          <Stack.Screen
            name='guessListPage'
            component={GuessListPage}
          />
          <Stack.Screen
            name='guessTextPage'
            component={GuessTextPage}
          />
          <Stack.Screen
            name='guessImagePage'
            component={GuessImagePage}
          />
          <Stack.Screen
            name='locationEditorPage'
            component={LocationEditorPage}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StatusContextProvider>
  );
}