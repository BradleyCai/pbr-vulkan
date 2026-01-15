# PBR in Vulkan

This project is a PBR implementation in Vulkan with IBL. It's able to load PBR authored gltf files
and display them. It uses [vkguide.dev](https://vkguide.dev) as a base.

The PBR implementation is based off of [leanopengl](https://learnopengl.com/PBR/Theory)'s guide,
and uses radiance and irradiance maps generated from [cmft](https://github.com/dariomanesku/cmft).
The precomputed BRDF integration map was calculated in the vulkan engine.

A demo of this project is on my website here:  
https://bradleycai.github.io/showcase/pbr-vulkan/
