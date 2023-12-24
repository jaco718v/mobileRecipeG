import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatusContextProvider from './context/context';

import LoginPage from './screens/loginView';

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
        </Stack.Navigator>
      </NavigationContainer>
    </StatusContextProvider>
  );
}