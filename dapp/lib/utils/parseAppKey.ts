export type ParsedAppKey = {
  package: string;
  module: string;
  appKey: string;
};

/**
 * Parse a fully qualified Move type string into its components.
 * Input format: "package_id::module_name::type_name"
 * Example: "00b79ef1bfbe9f21f4062973fe6818ea99331b8d3a50a99da114a71fb69be02a::dynamic_auth::AppKey"
 */
export function parseAppKey(fullyQualifiedType: string): ParsedAppKey {
  const parts = fullyQualifiedType.split("::");
  
  if (parts.length !== 3) {
    throw new Error(`Invalid app key format: expected "package::module::type", got "${fullyQualifiedType}"`);
  }

  return {
    package: parts[0],
    module: parts[1],
    appKey: parts[2],
  };
}
