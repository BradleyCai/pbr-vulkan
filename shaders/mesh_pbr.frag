#version 450

#extension GL_GOOGLE_include_directive : require
#include "input_structures.glsl"

layout(location = 0) in vec3 inNormal;
layout(location = 1) in vec3 inColor;
layout(location = 2) in vec2 inUV;
layout(location = 3) in vec3 inWorldPos;
layout(location = 4) in vec4 inTangent;

layout(location = 0) out vec4 outFragColor;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float DistributionGGX(vec3 N, vec3 H, float roughness) {
	float a      = roughness*roughness;
	float a2     = a*a;
	float NdotH  = max(dot(N, H), 0.0);
	float NdotH2 = NdotH*NdotH;
	
	float num   = a2;
	float denom = (NdotH2 * (a2 - 1.0) + 1.0);
	denom = PI * denom * denom;
	
	return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
	float r = (roughness + 1.0);
	float k = (r*r) / 8.0;

	float num   = NdotV;
	float denom = NdotV * (1.0 - k) + k;
	
	return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
	float NdotV = max(dot(N, V), 0.0);
	float NdotL = max(dot(N, L), 0.0);
	float ggx2  = GeometrySchlickGGX(NdotV, roughness);
	float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
	return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
	return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
	return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 GetCameraPositionFromViewMatrix(mat4 view)
{
	// Extract rotation (upper-left 3x3)
	mat3 R = mat3(view);
	// Extract translation (fourth column)
	vec3 t = vec3(view[3]);
	// Compute camera position in world space
	vec3 cameraPos = -transpose(R) * t;

	return cameraPos;
}

vec3 tonemapFilmic(vec3 color, float white) {
	// exposure bias: input scale (color *= bias, white *= bias) to make the brightness consistent with other tonemappers
	// also useful to scale the input to the range that the tonemapper is designed for (some require very high input values)
	// has no effect on the curve's general shape or visual properties
	const float exposure_bias = 2.0f;
	const float A = 0.22f * exposure_bias * exposure_bias; // bias baked into constants for performance
	const float B = 0.30f * exposure_bias;
	const float C = 0.10f;
	const float D = 0.20f;
	const float E = 0.01f;
	const float F = 0.30f;

	vec3 color_tonemapped = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
	float white_tonemapped = ((white * (A * white + C * B) + D * E) / (white * (A * white + B) + D * F)) - E / F;

	return color_tonemapped / white_tonemapped;
}

// input view right handed, y up, and z forward
// image coordinates start from top left
vec2 dirToRectilinear(vec3 dir) {
	float x = atan(-dir.x, dir.z) / TAU + 0.5;
	float y = 1.0 - (dir.y * 0.5 + 0.5);
	return vec2(x, y);
}

void main() {
	vec3 camPos = GetCameraPositionFromViewMatrix(sceneData.view);

	mat3 TBN = mat3(normalize(inTangent.xyz), normalize(cross(inNormal, inTangent.xyz)), normalize(inNormal));

	vec3 N = texture(normalTex, inUV).rgb * materialData.normalScale;
	N = N * 2.0 - 1.0;
	N = normalize(TBN * N);

	// vec3 N = normalize(inNormal);
	vec3 V = normalize(camPos - inWorldPos);

	vec4 baseColor = texture(colorTex, inUV);
	vec3 emissive = texture(emissiveTex, inUV).rgb * materialData.emissiveFactors * materialData.emissiveStrength;
	vec4 metalRough = texture(metalRoughTex, inUV);
	float ao = texture(occlusionTex, inUV).r * materialData.metal_rough_factors.r;
	float roughness = metalRough.g * materialData.metal_rough_factors.g;
	float metallic = metalRough.b * materialData.metal_rough_factors.b;
	vec3 albedo = baseColor.rgb * materialData.colorFactors.rgb;

	vec3 F0 = vec3(0.04);
	F0 = mix(F0, albedo, metallic);

	// reflectance equation
	vec3 Lo = vec3(0.0);
	for(int i = 0; i < 4; ++i) {
		// calculate per-light radiance
		vec3 L = normalize(sceneData.lightPositions[i].xyz - inWorldPos);
		vec3 H = normalize(V + L);
		float distance = length(sceneData.lightPositions[i].xyz - inWorldPos);
		// float attenuation = 0.5;
		float attenuation = 1.0 / (distance * distance * 0.5);
		vec3 radiance = sceneData.lightColors[i].rgb * sceneData.lightColors[i].w * attenuation;

		// cook-torrance brdf
		float NDF = DistributionGGX(N, H, roughness);
		float G = GeometrySmith(N, V, L, roughness);
		vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

		vec3 kS = F;
		vec3 kD = vec3(1.0) - kS;
		kD *= 1.0 - metallic;

		vec3 numerator = NDF * G * F;
		float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
		vec3 specular = numerator / denominator;

		// add to outgoing radiance Lo
		float NdotL = max(dot(N, L), 0.0);
		Lo += (kD * albedo / PI + specular) * radiance * NdotL;
	}

	vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);

	vec3 kS = F;
	vec3 kD = 1.0 - kS;
	kD *= 1.0 - metallic;

	vec3 irradiance = texture(skyIrradiance, dirToRectilinear(N)).rgb * 0.5;
	vec3 diffuse = irradiance * albedo;

	const float MAX_REFLECTION_LOD = 10.0;
	vec3 reflectedView = reflect(-V, N);
	vec3 prefilteredColor = textureLod(skyRadiance, dirToRectilinear(reflectedView), roughness * MAX_REFLECTION_LOD).rgb * 0.5;
	vec2 envBRDF  = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
	vec3 specular = prefilteredColor * (F * envBRDF.x + envBRDF.y);

	vec3 ambient = (kD * diffuse + specular) * ao * sceneData.settings.ambientStrength;

	vec3 color = ambient + Lo + emissive;

	color = tonemapFilmic(color, 1.0);
	color = pow(color, vec3(1.0 / 2.2));

	outFragColor = vec4(color, baseColor.a);
}