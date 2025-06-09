export function formatModuleName(input: string): string {
  return input
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
// export function formatModuleName(input: string): string {
//   return input
//     .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
//     .split(" ")
//     .map((word) => {
//       return word.charAt(0).toUpperCase() + word.slice(1);
//     })
//     .join(" ");
// }
