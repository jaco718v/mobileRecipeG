export function getNextId(collectionData){
  if (collectionData === undefined || collectionData.length == 0){
    return 0
  }
  const highestId = Math.max(...collectionData.map(n => Number(n.id)))
  return (highestId+1)
}