export function getNextId(collectionData){
  const highestId = Math.max(...collectionData.map(n => Number(n.id)))
  return (highestId+1)
}