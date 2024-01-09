import Toast from 'react-native-toast-message';

export function getNextId(collectionData){
  if (collectionData === undefined || collectionData.length == 0){
    return 0
  }
  const highestId = Math.max(...collectionData.map(n => Number(n.id)))
  return (highestId+1)
}

export function successToast(message) {
  Toast.show({
      type: 'success',
      text1: message,
  });
}

export function errorToast(message) {
  Toast.show({
      type: 'error',
      text1: message,
  });
}
