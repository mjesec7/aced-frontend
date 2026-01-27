import { ref, computed, reactive } from 'vue';

export function useGeometry() {
    // State
    const canvasRef = ref(null);
    const isDrawing = ref(false);
    const startPoint = ref({ x: 0, y: 0 });
    const currentPoint = ref({ x: 0, y: 0 });
    const feedback = ref(null);
    const drawnLines = ref([]);
    const measuredAngle = ref(0);

    const config = reactive({
        center: { x: 150, y: 150 },
        radius: 100,
        tolerance: 20
    });

    const getDistance = (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const getPointOnCircle = (angle, center, radius) => {
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        };
    };

    // --- Drawing Logic (Diameter) ---

    const startDrawing = (event) => {
        if (!canvasRef.value) return;
        const rect = canvasRef.value.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        isDrawing.value = true;
        startPoint.value = { x, y };
        currentPoint.value = { x, y };
        feedback.value = null;
    };

    const draw = (event) => {
        if (!isDrawing.value || !canvasRef.value) return;
        const rect = canvasRef.value.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        currentPoint.value = { x, y };

        // Visual feedback during drawing (handled by component using these refs)
    };

    const stopDrawing = () => {
        if (!isDrawing.value) return;
        isDrawing.value = false;

        // Validate the line
        validateDiameter(startPoint.value, currentPoint.value);
    };

    const validateDiameter = (start, end) => {
        // 1. Check length (should be close to 2 * radius)
        const length = getDistance(start, end);
        const expectedLength = config.radius * 2;

        // 2. Check if it passes near center
        // Distance from point (center) to line defined by start/end
        // |(y2-y1)x0 - (x2-x1)y0 + x2y1 - y2x1| / length
        const numerator = Math.abs(
            (end.y - start.y) * config.center.x -
            (end.x - start.x) * config.center.y +
            end.x * start.y -
            end.y * start.x
        );
        const distanceToCenter = numerator / length;

        // 3. Check endpoints (should be near the circle edge)
        const distStartToCenter = getDistance(start, config.center);
        const distEndToCenter = getDistance(end, config.center);

        const isStartOnEdge = Math.abs(distStartToCenter - config.radius) < config.tolerance;
        const isEndOnEdge = Math.abs(distEndToCenter - config.radius) < config.tolerance;

        // Validation Logic
        const isLengthValid = Math.abs(length - expectedLength) < (config.tolerance * 2);
        const isCenterValid = distanceToCenter < config.tolerance;

        if (isLengthValid && isCenterValid && isStartOnEdge && isEndOnEdge) {
            // Success! Snap to perfect diameter
            // Calculate angle of the drawn line
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            const perfectStart = getPointOnCircle(angle + Math.PI, config.center, config.radius);
            const perfectEnd = getPointOnCircle(angle, config.center, config.radius);

            drawnLines.value = [{
                start: perfectStart,
                end: perfectEnd,
                isCorrect: true
            }];

            feedback.value = { type: 'success', message: 'Perfect diameter!' };
            return true;
        } else {
            // Failure
            drawnLines.value = [{
                start: start,
                end: end,
                isCorrect: false
            }];

            if (!isCenterValid) {
                feedback.value = { type: 'error', message: 'The diameter must pass through the center.' };
            } else if (!isLengthValid || !isStartOnEdge || !isEndOnEdge) {
                feedback.value = { type: 'error', message: 'The diameter must touch both sides of the circle.' };
            }

            // Clear incorrect line after delay
            setTimeout(() => {
                drawnLines.value = [];
                feedback.value = null;
            }, 1500);

            return false;
        }
    };

    // --- Measuring Logic (Angles) ---

    const updateAngle = (event) => {
        if (!canvasRef.value) return;
        const rect = canvasRef.value.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate angle relative to center
        let angle = Math.atan2(y - config.center.y, x - config.center.x) * (180 / Math.PI);

        // Normalize to 0-360
        if (angle < 0) angle += 360;

        measuredAngle.value = Math.round(angle);
    };

    // --- Reset ---
    const resetGeometry = () => {
        drawnLines.value = [];
        measuredAngle.value = 0;
        feedback.value = null;
        isDrawing.value = false;
    };

    return {
        canvasRef,
        isDrawing,
        startPoint,
        currentPoint,
        drawnLines,
        measuredAngle,
        feedback,
        config,
        startDrawing,
        draw,
        stopDrawing,
        updateAngle,
        resetGeometry
    };
}
