const defaultSymbol =
  typeof Symbol === "function" ? Symbol : name => "@@" + name;

export default function createSymbol(name) {
  return defaultSymbol(name);
}
