struct Settings {
	float ambientStrength;
	float _pad1;
	float _pad2;
	float _pad3;
};

layout(std140, set = 0, binding = 0) uniform SceneData {
	mat4 view;
	mat4 proj;
	mat4 viewproj;
	vec4 sunlightDirection;
	vec4 sunlightColor;

	vec4 lightPositions[4];
	vec4 lightColors[4];

	Settings settings;
} sceneData;

layout(set = 0, binding = 1) uniform sampler2D skyTexture;
layout(set = 0, binding = 2) uniform sampler2D skyIrradiance;
layout(set = 0, binding = 3) uniform sampler2D skyRadiance;
layout(set = 0, binding = 4) uniform sampler2D brdfLUT;

layout(set = 1, binding = 0) uniform GLTFMaterialData {
	vec4 colorFactors;
	vec4 metal_rough_factors;
	vec3 emissiveFactors;
	float normalScale;
	float emissiveStrength;
} materialData;

layout(set = 1, binding = 1) uniform sampler2D colorTex;
layout(set = 1, binding = 2) uniform sampler2D normalTex;
layout(set = 1, binding = 3) uniform sampler2D metalRoughTex;
layout(set = 1, binding = 4) uniform sampler2D occlusionTex;
layout(set = 1, binding = 5) uniform sampler2D emissiveTex;
