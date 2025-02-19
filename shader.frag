precision mediump float;

varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;

uniform float u_time;
uniform float u_z;
uniform float u_invert;

uniform float u_range_min_r;
uniform float u_range_min_g;
uniform float u_range_min_b;

uniform float u_range_max_r;
uniform float u_range_max_g;
uniform float u_range_max_b;

uniform float u_intensity_r;
uniform float u_intensity_g;
uniform float u_intensity_b;

uniform float u_contrast;
uniform float u_n;
uniform float u_exposure;

const int TOTAL_POINTS = 200; 

uniform float u_points[(TOTAL_POINTS + 1) * 3];


void main() {

    float max_dist = u_contrast;

    float m_dist = max_dist; 

    for (int i = 0; i < (TOTAL_POINTS + 1) * 3; i+=3) {

        vec3 p = vec3(u_points[i], u_points[i + 1], u_points[i + 2]);
        vec3 obs = vec3(vTexCoord.x, vTexCoord.y, u_z);

        float dist = distance(obs, p);
        m_dist = min(m_dist, dist);
    }

    float color =  m_dist;

    color *= 10.0 / u_exposure;
    color = smoothstep(max_dist * 0.2, max_dist * 0.6, color);
    color = 1.0 - color;

    // float enhanceR = smoothstep(u_range_min_r, u_range_max_r, color) * u_intensity_r;
    // float enhanceG = smoothstep(u_range_min_g, u_range_max_g, color) * u_intensity_g;
    // float enhanceB = smoothstep(u_range_min_b, u_range_max_b, color) * u_intensity_b;
    // color += enhance;

    // float r = color + enhanceR;
    // float g = color + enhanceG;
    // float b = color + enhanceB;

    // r = 1.0 - u_invert + (-1.0 + 2.0 * u_invert) * r;
    // g = 1.0 - u_invert + (-1.0 + 2.0 * u_invert) * g;
    // b = 1.0 - u_invert + (-1.0 + 2.0 * u_invert) * b;
    // float r = smoothstep(0.3, 0.65, color);
    // float g = smoothstep(0.15, 0.7, color);
    // float b = smoothstep(0.0, 0.95, color);



    // gl_FragColor = vec4(r, g, b, 1.0);
    gl_FragColor = vec4(color, color, color, 1.0);
}
