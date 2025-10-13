#include <vk_types.h>
#include <SDL_events.h>

class Camera
{
public:
	bool dragging{false};

	glm::vec3 velocity;
	glm::vec3 position;
	float yaw{0.f};
	float pitch{0.f};
	float fov{90.f};
	float distance{5.f};

	glm::mat4 getViewMatrix();
	glm::mat4 getRotationMatrix();

	void processSDLEvent(SDL_Event &e);

	void update();
};
