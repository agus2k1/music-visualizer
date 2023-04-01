const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    varying float vPattern;

    uniform float uTime;
    uniform float uAudioFrequency;

    // COLOR_RAMP macro
    struct ColorStop {
        vec3 color;
        float position; // range [0, 1]
    };

    /* ** COLOR_RAMP macro -> based on Blender's ColorRamp Node in the shading tab
    ColorStop[?] colors -> array of color stops that can have any length
    float factor -> the position that you want to know the color of -> [0, 1]
    vec3 finalColor -> the final color based on the factor 
    */
    #define COLOR_RAMP(colors, factor, finalColor) { \
        int index = 0; \
        for(int i = 0; i < colors.length() - 1; i++){ \
        ColorStop currentColor = colors[i]; \
        bool isInBetween = currentColor.position <= factor; \
        index = isInBetween ? i : index; \
        } \
        ColorStop currentColor = colors[index]; \
        ColorStop nextColor = colors[index + 1]; \
        float range = nextColor.position - currentColor.position; \
        float lerpFactor = (factor - currentColor.position) / range; \
        finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
    } \

    void main() {
        float time = uTime * (1.0 + uAudioFrequency);

        vec3 color;

        vec3 mainColor = mix(vec3(0.2, 0.3, 0.9), vec3(0.4, 1., 0.3), uAudioFrequency);

        mainColor.r *= 0.9 + sin(time) / 3.2;
        mainColor.g *= 1.1 + sin(time / 2.) / 2.5;
        mainColor.b *= 0.8 + sin(time / 5.) / 4.0;

        mainColor.rgb += 0.1;

        ColorStop[4] colors = ColorStop[](
            ColorStop(vec3(1.), 0.),
            ColorStop(vec3(1.), 0.01),
            ColorStop(mainColor, 0.1),
            ColorStop(vec3(0.01, 0.05, 0.2), 1.)
        );

        COLOR_RAMP(colors, vPattern, color);
        gl_FragColor = vec4( vec3(color), 1.);
    }
`;

export default fragmentShader;
