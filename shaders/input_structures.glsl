layout(set = 0, binding = 0) uniform SceneData {
	mat4 view;
	mat4 proj;
	mat4 viewproj;
	vec4 ambientColor;
	vec4 sunlightDirection; //w for sun power
	vec4 sunlightColor;

	// // lights
	vec3 lightPositions[4];
	vec3 lightColors[4];
} sceneData;

layout(set = 1, binding = 0) uniform GLTFMaterialData {
	vec4 colorFactors;
	vec4 metal_rough_factors;
} materialData;

layout(set = 1, binding = 1) uniform sampler2D colorTex;
layout(set = 1, binding = 2) uniform sampler2D metalRoughTex;
// // material parameters
// vec3 albedo;
// float metallic;
// float roughness;
// float ao;