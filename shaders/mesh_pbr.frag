#version 450

#extension GL_GOOGLE_include_directive : require
#include "input_structures.glsl"

layout(location = 0) in vec3 inNormal;
layout(location = 1) in vec3 inColor;
layout(location = 2) in vec2 inUV;
layout(location = 3) in vec3 inWorldPos;

layout(location = 0) out vec4 outFragColor;

const float PI = 3.14159265359;

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

// TODO
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

void main() {
	vec3 camPos = GetCameraPositionFromViewMatrix(sceneData.view);

	vec3 N = inNormal; // TODO is this really needed
	vec3 V = normalize(camPos - inWorldPos);

	vec4 metalRough = texture(metalRoughTex, inUV);
	float roughness = metalRough.g * materialData.metal_rough_factors.g;
	float metallic = metalRough.b * materialData.metal_rough_factors.b;
	vec3 albedo = texture(colorTex, inUV).rgb * materialData.colorFactors.rgb;
	float ao = metalRough.a;

	vec3 F0 = vec3(0.04);
	F0 = mix(F0, albedo, metallic);

	// reflectance equation
	vec3 Lo = vec3(0.0);
	for(int i = 0; i < 4; ++i) {
		// calculate per-light radiance
		vec3 L = normalize(sceneData.lightPositions[i] - inWorldPos);
		vec3 H = normalize(V + L);
		// TODO look into how to set up these properties in the light itself
		float distance = length(sceneData.lightPositions[i] - inWorldPos);
		// float attenuation = 0.5;
		float attenuation = 1.0 / (distance * distance * 0.5);
		vec3 radiance = sceneData.lightColors[i] * attenuation;

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

	vec3 ambient = vec3(0.03) * albedo * ao;
	vec3 color = ambient + Lo;

	color = color / (color + vec3(1.0));
	color = pow(color, vec3(1.0 / 2.2));

	outFragColor = vec4(color, 1.0);
}