import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatusContextProvider from './context/context';
import { app } from './components/config';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import  ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

import LoginPage from './screens/loginView';
import SignUpPage from './screens/singUpView';
import MapPage from './screens/mapView';

export default function App() {
  const Stack = createNativeStackNavigator();
  
  let auth
  if(Platform.OS === 'web'){
  auth = getAuth(app)
  }else{
  auth = initializeAuth(app, {
      persistence:getReactNativePersistence(ReactNativeAsyncStorage)
  })
  }

  return (
    <StatusContextProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='LoginPage'>
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
        </Stack.Navigator>
      </NavigationContainer>
    </StatusContextProvider>
  );
}