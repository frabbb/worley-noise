attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  // Copy the position data into a vec4, adding 1.0 as the w parameter
  vec4 positionVec4 = vec4(aPosition, 1.0);
  
  // Scale to make range -1 to 1
  positionVec4.xy = positionVec4.xy * 2.0;
  
  // Send varying to fragment shader
  vTexCoord = aTexCoord;
  
  // GL position
  gl_Position = positionVec4;
}