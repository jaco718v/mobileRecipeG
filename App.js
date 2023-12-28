import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatusContextProvider from './context/context';

import LoginPage from './screens/loginView';
import SignUpPage from './screens/singUpView';
import MapPage from './screens/mapView';

export default function App() {
  const Stack = createNativeStackNavigator();
  

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