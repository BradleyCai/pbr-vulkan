#include <vk_types.h>
#include <SDL_events.h>

class Camera
{
public:
	bool dragging{false};
	glm::vec3 velocity;
	glm::vec3 position;
	// vertical rotation
	float pitch{0.f};
	// horizontal rotation
	float yaw{0.f};
	// distance from target when using orbit style
	float distance{5.f};

	glm::mat4 getViewMatrix();
	glm::mat4 getRotationMatrix();

	void processSDLEvent(SDL_Event &e);

	void update();
};
