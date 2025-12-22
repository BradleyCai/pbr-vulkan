#include <camera.h>
#include <glm/gtx/transform.hpp>
#include <glm/gtx/quaternion.hpp>
#include <glm/gtc/constants.hpp>

void Camera::update()
{
	glm::mat4 cameraRotation = getRotationMatrix();
	position += glm::vec3(cameraRotation * glm::vec4(velocity * 0.03f, 0.f));
}

void Camera::processSDLEvent(SDL_Event &e)
{
	if (!dragging && e.type == SDL_MOUSEBUTTONDOWN &&
		(e.button.button == SDL_BUTTON_MIDDLE))
	{
		dragging = true;
		SDL_SetRelativeMouseMode(SDL_TRUE);
	}
	else if (dragging && e.type == SDL_MOUSEBUTTONUP &&
		(e.button.button == SDL_BUTTON_MIDDLE))
	{
		dragging = false;
		SDL_SetRelativeMouseMode(SDL_FALSE);
	}

	if (dragging && e.type == SDL_MOUSEMOTION)
	{
		const float viewSensitivity = 1.f / 200.f;
		yaw -= (float)e.motion.xrel * viewSensitivity;
		pitch = glm::max(glm::min(pitch - (float)e.motion.yrel * viewSensitivity, glm::half_pi<float>()), -glm::half_pi<float>());
	}

	if (e.type == SDL_MOUSEWHEEL)
	{
		const float minZoom = 0.5f;
		const float maxZoom = 20.f;
		const float zoomSensitivity = 0.3f;

		distance -= (float)e.wheel.y * zoomSensitivity;
		if (distance < minZoom)
		{
			distance = minZoom;
		}
		else if (distance > maxZoom)
		{
			distance = maxZoom;
		}
	}
}

glm::mat4 Camera::getViewMatrix()
{
	// to create a correct model view, we need to move the world in opposite
	// direction to the camera
	// so we will create the camera model matrix and invert
	glm::mat4 cameraTranslation = glm::translate(glm::mat4(1.f), position);
	glm::mat4 cameraRotation = getRotationMatrix();
	glm::mat4 distanceTranslation = glm::translate(glm::vec3(0, 0, distance));
	return glm::inverse(cameraTranslation * cameraRotation * distanceTranslation);
}

glm::mat4 Camera::getRotationMatrix()
{
	// fairly typical FPS style camera. we join the pitch and yaw rotations into
	// the final rotation matrix
	glm::quat pitchRotation = glm::angleAxis(pitch, glm::vec3{1.f, 0.f, 0.f});
	glm::quat yawRotation = glm::angleAxis(yaw, glm::vec3{0.f, 1.f, 0.f});
	glm::quat rollRotation = glm::angleAxis(0.0f, glm::vec3{0.f, 0.f, 1.f});

	return glm::toMat4(yawRotation) * glm::toMat4(pitchRotation) * glm::toMat4(rollRotation);
}
