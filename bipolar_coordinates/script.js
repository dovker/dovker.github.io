var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

function createSlider(label, id, min, max, step, value, onInputCallback) {
    var container = document.getElementById("uiContainer");

    var labelElement = document.createElement("label");
    labelElement.textContent = label;
    container.appendChild(labelElement);

    var sliderContainer = document.createElement("div");
    sliderContainer.classList.add("slider-container");
    container.appendChild(sliderContainer);

    var sliderElement = document.createElement("input");
    sliderElement.type = "range";
    sliderElement.id = id;
    sliderElement.min = min;
    sliderElement.max = max;
    sliderElement.step = step;
    sliderElement.value = value;
    sliderElement.addEventListener("input", function () {
        onInputCallback(sliderElement.value);
    });
    sliderContainer.appendChild(sliderElement);

    var valueElement = document.createElement("span");
    valueElement.classList.add("slider-value");
    valueElement.textContent = value;
    sliderContainer.appendChild(valueElement);
}

function loadShader(url) {
    var request = new XMLHttpRequest();
    request.open("GET", url, false);
    request.send(null);

    if (request.status === 200) {
        return request.responseText;
    } else {
        console.error("Failed to load shader:", request.statusText);
        return null;
    }
}

var position = new BABYLON.Vector2(0.0, 0.0);
var upcomingPosition = new BABYLON.Vector2(0.0, 0.0);
var scale = 1.0;
var upcomingScale = 1.0;

var updateUniforms = function(){};

const createScene = function()
{
    var scene = new BABYLON.Scene(engine);
    
    var quad = BABYLON.MeshBuilder.CreatePlane("quad", { size: 2 }, scene);
    quad.position.z = 0;
    
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -1), scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoLeft = -1;
    camera.orthoRight = 1;
    camera.orthoTop = 1;
    camera.orthoBottom = -1;



    BABYLON.Effect.ShadersStore["customVertexShader"]  = loadShader("vs.glsl");
    BABYLON.Effect.ShadersStore["customFragmentShader"]  = loadShader("fs.glsl");

    var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {
        vertex: "custom",
        fragment: "custom",
    },
    {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection", "FocalPoint", "FocalPoint2", "SquareCount", "Resolution", "Position", "Scale"]
    });

    quad.material = shaderMaterial;


    var isDragging = false;
    var lastPointerX;
    var lastPointerY;

    scene.onPointerObservable.add(function (pointerInfo) {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            isDragging = true;
            lastPointerX = pointerInfo.event.clientX;
            lastPointerY = pointerInfo.event.clientY;
        }
        else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
            isDragging = false;
        }
        else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && isDragging) {
            var deltaX = pointerInfo.event.clientX - lastPointerX;
            var deltaY = pointerInfo.event.clientY - lastPointerY;

            upcomingPosition.x -= deltaX;
            upcomingPosition.y += deltaY;

            lastPointerX = pointerInfo.event.clientX;
            lastPointerY = pointerInfo.event.clientY;
        }
    });


    createSlider("Foci X Position:", "xPosition", -10, 10, 0.1, -1, function (value) {
        updateSliderValue("xPosition", value);
    });

    createSlider("Foci Y Position:", "yPosition", -10, 10, 0.1, 0, function (value) {
        updateSliderValue("yPosition", value);
    });

    createSlider("2nd Foci X Position:", "xPosition2", -10, 10, 0.1, -1, function (value) {
        updateSliderValue("xPosition2", value);
    });

    createSlider("2nd Foci Y Position:", "yPosition2", -10, 10, 0.1, 0, function (value) {
        updateSliderValue("yPosition2", value);
    });
    
    createSlider("Square Subdivisions:", "squareCount", 0.1, 10, 0.01, 1, function (value) {
        updateSliderValue("squareCount", value);
    });

    createSlider("Scale:", "scaleSlider", 0.01, 5, 0.01, 1, function (value) {
        updateSliderValue("scaleSlider", value);
         upcomingScale = value;
    });

    function updateSliderValue(sliderId, value) {
        var valueElement = document.querySelector(`#${sliderId} + .slider-value`);
        if (valueElement) {
            valueElement.textContent = value;
        }
    }

    updateUniforms = function ()
    {
        shaderMaterial.setVector2("FocalPoint", new BABYLON.Vector2(parseFloat(document.getElementById("xPosition").value), 
                                                                parseFloat(document.getElementById("yPosition").value)));
        shaderMaterial.setVector2("FocalPoint2", new BABYLON.Vector2(parseFloat(document.getElementById("xPosition2").value), 
                                                                parseFloat(document.getElementById("yPosition2").value)));
        shaderMaterial.setFloat("SquareCount", parseFloat(document.getElementById("squareCount").value));
        shaderMaterial.setVector2("Resolution", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
        shaderMaterial.setVector2("Position", position);
        shaderMaterial.setFloat("Scale", scale);
    }
    updateUniforms();


    return scene;
}


const scene = createScene();

engine.runRenderLoop(function () {
    position.x = BABYLON.Scalar.Lerp(position.x, upcomingPosition.x, 0.15);
    position.y = BABYLON.Scalar.Lerp(position.y, upcomingPosition.y, 0.25);
    scale = BABYLON.Scalar.Lerp(scale, upcomingScale, 0.25);
    updateUniforms();

    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
    updateUniforms();
});