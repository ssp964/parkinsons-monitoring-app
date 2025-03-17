import cv2
import numpy as np
import os
import pandas as pd
import matplotlib.pyplot as plt
from keras.models import load_model
from skimage import filters
from scipy.stats import norm
from sklearn.mixture import GaussianMixture
from sklearn.cluster import KMeans
from utils.featureRules import (
    smooth_contour,
    determine_overlap,
    get_maximum_bounding,
    area_of_intersection,
)
from utils.digitsAngles import get_angle_priors
import sys

# Get the project root directory (2 levels up from current script)
project_root = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
sys.path.append(project_root)

from processing.utils import DatabaseUtil

# from ..utils import DatabaseUtil

# Paths

# Get the directory of the current script (cdt.py)
script_dir = os.path.dirname(os.path.abspath(__file__))
model_file = os.path.join(script_dir, "models/mnist_threshed_classifier.h5")

features_df = pd.DataFrame()
# ✅ Initialize a local dictionary to store features for the current image
features_dict = {}


def compute_clock_features(image):
    """
    Extracts key features from the clock drawing image.
    Returns a dictionary containing extracted features.
    """

    global features_df

    # Feature 1: Extract Contours from the clock drawing image

    vis = image.copy()
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY)[1]
    edges = filters.sobel(thresh)

    # Parameters for hysteresis
    low = 0.01
    high = 0.20

    hyst = filters.apply_hysteresis_threshold(edges, low, high).astype(int)
    hight = (edges > high).astype(np.uint8)
    inverted = hight + hyst

    # Part 1: Contours #

    contours = cv2.findContours(
        inverted.copy().astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE
    )
    biggest_moment = 0
    clock_contour = None

    # Loop through all contours, find the one with the biggest min circle area
    for c in contours[0]:
        # compute the center of the contour

        circle_center, radius = cv2.minEnclosingCircle(c)
        area = np.pi * (radius**2)
        arc_length = cv2.arcLength(c, True)

        if area > biggest_moment:
            biggest_moment = area
            clock_contour = c

    epsilon = 0.009 * cv2.arcLength(clock_contour, True)
    hull = cv2.convexHull(clock_contour, returnPoints=True)
    approx = cv2.approxPolyDP(clock_contour, epsilon, True)

    removals = 0
    while True:
        approx, stable = smooth_contour(approx)
        if stable:
            break
        else:
            removals += 1

    # At this point we have 3 approximations of the contour; original, reduced, and hull

    best_curve = None
    best_circularity = 0
    best_ratio = 0.0

    for curve in (clock_contour, approx, hull):
        try:
            M = cv2.moments(curve)
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
        except:
            cX = int(inverted.shape[1] / 2)
            cY = int(inverted.shape[0] / 2)

        max_radius = 0
        min_radius = 1000
        for point in curve:
            radius = np.linalg.norm(point - np.array([cX, cY]))
            if radius > max_radius:
                max_radius = radius
            if radius < min_radius:
                min_radius = radius

        area = cv2.contourArea(curve)
        arc_length = cv2.arcLength(curve, True)
        circularity = 4 * np.pi * area / (arc_length * arc_length)
        radius_ratio = min_radius / max_radius
        if radius_ratio > best_ratio:
            best_ratio = radius_ratio
            best_curve = curve

    M = cv2.moments(best_curve)
    try:
        cX = int(M["m10"] / M["m00"])
        cY = int(M["m01"] / M["m00"])
    except:
        cX = int(inverted.shape[1] / 2)
        cY = int(inverted.shape[0] / 2)

    cv2.drawContours(vis, [best_curve], -1, (0, 0, 255), 2)
    circle_center, radius = cv2.minEnclosingCircle(best_curve)

    cv2.circle(vis, (cX, cY), 5, (0, 0, 255), -1)

    cv2.circle(
        vis,
        (int(circle_center[0]), int(circle_center[1])),
        int(radius),
        (0, 255, 255),
        2,
    )
    cv2.circle(
        vis, (int(circle_center[0]), int(circle_center[1])), 5, (0, 255, 255), -1
    )

    center_deviation = np.linalg.norm(circle_center - np.array([cX, cY]))

    # Set removal value to 0 if reduced contour wasn't chosen
    approx_area = cv2.contourArea(approx)
    approx_arc_length = cv2.arcLength(approx, True)
    approx_circularity = (
        4 * np.pi * approx_area / (approx_arc_length * approx_arc_length)
    )
    if best_circularity != approx_circularity:
        removals = 0

    # Add features one by one
    features_dict["Circularity"] = circularity
    features_dict["RadiusRatio"] = best_ratio
    features_dict["CenterPoint"] = [(cX, cY)]
    features_dict["RemovedPoints"] = removals
    features_dict["Radius"] = radius
    features_dict["CenterDeviation"] = center_deviation

    # Bleach out the contour for better hand detection and unused ink tallies
    bleached = thresh.copy()
    cv2.drawContours(bleached, [best_curve], -1, (255, 255, 255), 25)

    # ------------------------------------------------------------------------------------------------------------------ #
    # Feature 2: Extract digits from the clock drawing image

    model = load_model(model_file)
    intersect_threshold = 0.5
    box_threshold = 80
    number_threshold = 0.5
    sigma = 15

    recognized_digits = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0}

    # # Phase 1 - No further preprocessing, use MSER to get blobs

    delta = 5
    min_area = 60
    max_area = 14400
    max_variation = 0.5
    min_diversity = 0.2
    max_evolution = 200
    area_threshold = 1.01
    min_margin = 0.003
    edge_blur_size = 5
    mser = cv2.MSER_create()
    mser.setDelta(delta)
    mser.setMinArea(min_area)
    mser.setMaxArea(max_area)
    mser.setMaxVariation(max_variation)
    mser.setMinDiversity(min_diversity)
    mser.setMaxEvolution(max_evolution)
    mser.setAreaThreshold(area_threshold)
    mser.setMinMargin(min_margin)
    mser.setEdgeBlurSize(edge_blur_size)

    regions, _ = mser.detectRegions(gray)
    boxes = [cv2.boundingRect(p.reshape(-1, 1, 2)) for p in regions]
    small_boxes = []
    for box in boxes:
        if box[2] > box_threshold or box[3] > box_threshold:
            continue
        else:
            small_boxes.append(box)

    # Phase 2 - Gaussian blurring and thresholding to solve for scanning abberations

    mser = cv2.MSER_create()
    mser.setDelta(delta)
    mser.setMinArea(min_area)
    mser.setMaxArea(max_area)
    mser.setMaxVariation(max_variation)
    mser.setMinDiversity(min_diversity)
    mser.setMaxEvolution(max_evolution)
    mser.setAreaThreshold(area_threshold)
    mser.setMinMargin(min_margin)
    mser.setEdgeBlurSize(edge_blur_size)

    regions, _ = mser.detectRegions(thresh)
    boxes = [cv2.boundingRect(p.reshape(-1, 1, 2)) for p in regions]
    for box in boxes:
        if box[2] > box_threshold or box[3] > box_threshold:
            continue
        else:
            small_boxes.append(box)

    # Phase 3 - remove the outer contour and find boxes in what remains

    inv = 255 - thresh

    # draw the contour and center of the shape on the image
    if clock_contour is not None:
        cv2.drawContours(inv, [clock_contour], -1, (0, 0, 0), 17)

    # cv2.imshow("thr", inv)
    # cv2.waitKey(0)
    mser = cv2.MSER_create()
    mser.setDelta(delta)
    mser.setMinArea(min_area)
    mser.setMaxArea(max_area)
    mser.setMaxVariation(max_variation)
    mser.setMinDiversity(min_diversity)
    mser.setMaxEvolution(max_evolution)
    mser.setAreaThreshold(area_threshold)
    mser.setMinMargin(min_margin)
    mser.setEdgeBlurSize(edge_blur_size)

    regions, _ = mser.detectRegions(inv)
    boxes = [cv2.boundingRect(p.reshape(-1, 1, 2)) for p in regions]
    for box in boxes:
        if box[2] > box_threshold or box[3] > box_threshold:
            continue
        else:
            small_boxes.append(box)

    # Phase 5 - remove intersecting boxes and feed remainder through classifier

    # Parse out boxes that cover the same area
    for box in small_boxes[:]:
        for other_box in small_boxes[:]:
            if other_box == box:
                continue
            aoi = area_of_intersection(box, other_box)
            if aoi != 0:
                box_area = box[2] * box[3]
                other_box_area = other_box[2] * other_box[3]
                try:
                    if box_area >= other_box_area:
                        if aoi / float(other_box_area) >= intersect_threshold:
                            small_boxes.remove(other_box)
                    else:
                        if aoi / float(box_area) >= intersect_threshold:
                            small_boxes.remove(box)
                except:
                    pass

    small_boxes = list(set(small_boxes))
    number_crops = []
    for box in small_boxes:
        crop = thresh[box[1] : box[1] + box[3] + 1, box[0] : box[0] + box[2] + 1]

        side_length = max(box[2], box[3]) + 6
        background = np.full((side_length, side_length), 255.0)

        x1 = int((side_length - box[2]) / 2)
        y1 = int((side_length - box[3]) / 2)
        x2 = x1 + box[2] + 1
        y2 = y1 + box[3] + 1

        background[y1:y2, x1:x2] = crop
        number_crops.append([cv2.resize(background, (28, 28)), box])

    passable_crops = []
    radii = []
    angles = []
    areas = []
    for crop in number_crops:
        cropped_image = crop[0]
        box = crop[1]

        cropped_image = cropped_image.astype("float32") / 255
        cropped_image = np.expand_dims(cropped_image, 0)
        cropped_image = np.expand_dims(cropped_image, -1)
        probs = model.predict(cropped_image)
        box_center_x = box[0] + (box[2] / 2)
        box_center_y = box[1] + (box[3] / 2)

        r = np.linalg.norm(np.array([cX, cY]) - np.array([box_center_x, box_center_y]))
        # Disregard boxes with a center further than the clock radius
        if r >= radius:
            continue
        if r <= 0.33 * radius:
            continue
        r_ratio = r / radius
        angle = (
            -1 * (np.arctan2(box_center_y - cY, box_center_x - cX) * 180 / np.pi) + 360
        ) % 360
        average_r_ratio = 0.7
        area = box[2] * box[3]

        angle_priors = get_angle_priors(angle, sigma)
        dist_prob = norm.pdf(r_ratio, loc=average_r_ratio, scale=0.10)
        posteriors = dist_prob * (
            (angle_priors * probs)[0] / sum((angle_priors * probs)[0])
        )

        number = np.argmax(posteriors)
        # If garbage number is most probable, continue
        if number == 10:
            sorted_probs = np.sort(posteriors)
            if sorted_probs[-1] > sorted_probs[-2] * 2:
                continue
            else:
                posteriors = posteriors[:-1]
                number = np.argmax(posteriors)

        if np.max(posteriors) > number_threshold:

            # Save the angle and ratio, we think this is a digit
            angles.append(angle)
            radii.append(r_ratio)
            areas.append(area)

            # Tabulate the digit
            recognized_digits[number] += 1
            passable_crops.append(crop)
            cv2.rectangle(
                vis,
                (box[0], box[1]),
                (box[0] + box[2], box[1] + box[3]),
                (0, 150, 0),
                2,
            )
            # Bleach the bounding box on the copy for ink use detection
            cv2.rectangle(
                bleached,
                (box[0], box[1]),
                (box[0] + box[2], box[1] + box[3]),
                (255),
                -1,
            )
            cv2.putText(
                vis,
                str(number),
                (box[0] + 2, box[1] - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 100, 0),
                2,
            )

    # Store computed features in the DataFrame
    if len(radii) > 0:
        features_dict["DigitRadiusMean"] = np.mean(radii)
        features_dict["DigitRadiusStd"] = np.std(radii)

    if len(areas) > 0:
        features_dict["DigitAreaMean"] = np.mean(areas)
        features_dict["DigitAreaStd"] = np.std(areas)

    # Cluster the angles to find the average difference between them
    n_clusters = min(12, len(angles))
    if n_clusters > 0:
        kmeans = KMeans(n_clusters=n_clusters, random_state=0).fit(
            np.array(angles).reshape(-1, 1)
        )
        # print("Cluster Centers:", kmeans.cluster_centers_)
        # print("Angles List:", angles)
        cluster_centers_sorted = sorted(
            [center[0] for center in kmeans.cluster_centers_]
        )

        differences = [
            cluster_centers_sorted[j + 1] - cluster_centers_sorted[j]
            for j in range(len(cluster_centers_sorted) - 1)
        ]

        if len(differences) > 0:
            features_dict["DigitAngleMean"] = np.mean(differences)
            features_dict["DigitAngleStd"] = np.std(differences)

    # Count missing and extra digits
    missing_digits = 0
    extra_digits = 0

    expected_digits = {0: 1, 1: 5, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1}
    for digit, count in recognized_digits.items():
        if count > expected_digits[digit]:
            extra_digits += count - expected_digits[digit]
        elif count < expected_digits[digit]:
            missing_digits += expected_digits[digit] - count

    features_dict["ExtraDigits"] = extra_digits
    features_dict["MissingDigits"] = missing_digits

    # Feature 3: Extract Hand Features
    ####################################################################################################################

    black = 255 - bleached

    # Size of box to search for connected components comprising "hands"
    search_ratio = 0.3
    search_rect = [
        int(cX - radius * search_ratio),
        int(cY - radius * search_ratio),
        int(cX + radius * search_ratio),
        int(cY + radius * search_ratio),
    ]
    search_area = (radius * search_ratio) ** 2
    clock_area = np.pi * (radius**2)

    # Get the connected components for the image
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        black.astype(np.uint8)
    )

    # Set a mask which will contain all connected components with pixels within the search box
    mask = np.zeros((vis.shape[0], vis.shape[1], 1), dtype="uint8")
    num_components = 0
    bounding_box = None

    for j in range(1, num_labels):
        x = stats[j, cv2.CC_STAT_LEFT]
        y = stats[j, cv2.CC_STAT_TOP]
        w = stats[j, cv2.CC_STAT_WIDTH]
        h = stats[j, cv2.CC_STAT_HEIGHT]
        component_rect = [x, y, x + w, y + h]
        component_area = w * h

        # Throw away large components, don't want the whole clock
        if component_area >= clock_area * 0.80:
            continue
        # Throw away small components, probably noise
        if component_area < 50:
            continue

        # Anything left which overlaps should be added to the mask
        if determine_overlap(component_rect, search_rect):
            component_mask = (labels == j).astype("uint8") * 255
            # cv2.imshow("vsi", inverted)
            # cv2.waitKey(0)
            mask = cv2.bitwise_or(mask, component_mask)
            num_components += 1
            if bounding_box == None:
                bounding_box = [x, y, x + w, y + h]
            else:
                bounding_box = get_maximum_bounding(bounding_box, [x, y, x + w, y + h])

    blank_ch = 255 * np.ones_like(mask)
    inv_mask = cv2.bitwise_not(mask)

    # Draw the hands onto the evaluation drawing in blue
    colored_mask = cv2.merge([blank_ch, inv_mask, blank_ch])
    vis = cv2.bitwise_and(vis, colored_mask)
    # bleached = cv2.bitwise_and(bleached, blank_ch)
    if bounding_box:
        cv2.rectangle(
            bleached,
            (bounding_box[0], bounding_box[1]),
            (bounding_box[2], bounding_box[3]),
            (255),
            -1,
        )

    # Use the black and white mask to determine hands features

    # cv2.imshow("mask", mask)
    # cv2.waitKey(0)

    # Harris Corner detector parameters
    blockSize = 15
    apertureSize = 11
    k = 0.04
    threshold = 100

    kernel = np.ones((5, 5))
    fat_mask = mask
    for j in range(3):
        fat_mask = cv2.dilate(fat_mask, kernel)
    dst = cv2.cornerHarris(mask, blockSize, apertureSize, k)
    dst_norm = np.empty(dst.shape, dtype=np.float32)
    cv2.normalize(dst, dst_norm, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    dst_norm_scaled = cv2.convertScaleAbs(dst_norm)

    smallest_dist = 1000
    closest = (cX, cY)
    # Find the closest corner to the center
    for j in range(dst_norm.shape[0]):
        for k in range(dst_norm.shape[1]):
            if int(dst_norm[j, k]) > threshold:
                distance = np.linalg.norm(np.array([k, j]) - np.array([cX, cY]))
                if distance < smallest_dist:
                    smallest_dist = distance
                    closest = (k, j)

    cv2.circle(vis, (closest), 5, (255, 0, 155), -1)
    # cv2.imshow("Output", drawings[i])
    # cv2.waitKey(0)

    if np.any(np.where(mask > 0)):
        y_points, x_points = np.where(mask > 0)
        angles = (
            -1
            * (np.arctan2(y_points - closest[1], x_points - closest[0]) * 180 / np.pi)
            + 360
        ) % 360
        angles = angles.reshape(-1, 1)
        radii = np.linalg.norm(
            np.array([x_points, y_points])
            - np.array([closest[0], closest[1]]).reshape(-1, 1),
            axis=0,
        )

        mixture = GaussianMixture(n_components=2, random_state=0).fit(angles)
        mean1 = int(mixture.means_[0][0])
        mean2 = int(mixture.means_[1][0])

        # Get hands angle feature
        hands_angle = np.abs(mean1 - mean2)

        buffer = 7

        hand1_pts = len(
            np.where(((mean1 + buffer) > angles) & (angles > (mean1 - buffer)))[0]
        )
        hand1_idxs = np.argwhere(
            ((mean1 + buffer) > angles) & (angles > (mean1 - buffer))
        )
        try:
            hand1_radii = radii[hand1_idxs[:, 0]]
            hand1_length = np.max(hand1_radii)
        except:
            pass

        hand2_pts = len(
            np.where(((mean2 + buffer) > angles) & (angles > (mean2 - buffer)))[0]
        )
        hand2_idxs = np.argwhere(
            ((mean2 + buffer) > angles) & (angles > (mean2 - buffer))
        )
        try:
            hand2_radii = radii[hand2_idxs[:, 0]]
            hand2_length = np.max(hand2_radii)
        except:
            pass

        # Get hand length ratio feature
        try:
            short_hand = min(hand1_length, hand2_length)
            long_hand = max(hand1_length, hand2_length)
            length_ratio = short_hand / long_hand
        except:
            length_ratio = 0

        # Get hand density ratio feature
        little_hand = min(hand1_pts, hand2_pts)
        big_hand = max(hand1_pts, hand2_pts)
        density_ratio = little_hand / big_hand

        # Get bounding box ratio feature
        little_side = min(
            bounding_box[2] - bounding_box[0], bounding_box[3] - bounding_box[1]
        )
        big_side = max(
            bounding_box[2] - bounding_box[0], bounding_box[3] - bounding_box[1]
        )
        bb_ratio = little_side / big_side

        # print(mean1, hand1_pts)
        # print(mean2, hand2_pts)
        # print("")

        # Assign the features to the data frame
        features_dict["HandsAngle"] = hands_angle
        features_dict["DensityRatio"] = density_ratio
        features_dict["BBRatio"] = bb_ratio
        features_dict["LengthRatio"] = length_ratio
        features_dict["IntersectDistance"] = smallest_dist
        features_dict["NumComponents"] = num_components

    # ------------------------------------------------------------------------------------------------ #
    # Feature 4: Unaccounted Ink (measure of certainty in evaluation) #

    original = 255 - thresh
    original = original.astype(np.float32) / 255.0
    original_total = np.sum(original)

    bleached = 255 - bleached
    bleached = bleached.astype(np.float32) / 255.0
    bleached_total = np.sum(bleached)

    ink_ratio = bleached_total / original_total
    features_dict["LeftoverInk"] = ink_ratio
    pen_pressure = np.mean(np.where(gray < 255))
    features_dict["PenPressure"] = pen_pressure

    # Convert the dictionary to a DataFrame (single row)
    feature_row = pd.DataFrame([features_dict])

    # ✅ Append extracted features to the global DataFrame
    features_df = pd.concat([features_df, feature_row], ignore_index=True)

    return vis, features_df


def evaluate_clock_drawing(features_df):
    """
    Evaluates the clock drawing based on the scoring criteria and stores scores in a new DataFrame.
    """

    # Initialize the scoring dataframe
    scores_df = pd.DataFrame(
        columns=["Contour", "Numbers", "Hand_Length", "Hand_Centering"]
    )

    # Extract necessary features
    circularity = features_df["Circularity"].values[0]
    radius_ratio = features_df["RadiusRatio"].values[0]
    missing_digits = features_df["MissingDigits"].values[0]
    extra_digits = features_df["ExtraDigits"].values[0]
    length_ratio = features_df["LengthRatio"].values[0]
    intersect_distance = features_df["IntersectDistance"].values[0]

    # Compute Contour Score (1pt)
    contour_score = 1 if (circularity > 0.85 and radius_ratio > 0.75) else 0

    # Compute Numbers Score (1pt)
    numbers_score = 1 if (missing_digits == 0) else 0

    # Compute Hands Scores
    hand_length_score = (
        1 if length_ratio < 0.9 else 0
    )  # Hour hand is shorter than minute hand
    hand_centering_score = 1 if intersect_distance < 10 else 0  # Hands must be centered

    # Add the scores to the new dataframe
    scores_df = pd.DataFrame(
        [[contour_score, numbers_score, hand_length_score, hand_centering_score]],
        columns=["Contour", "Numbers", "Hand_Length", "Hand_Centering"],
    )

    return scores_df


def process_single_image(image_path):
    """
    Processes a single clock image: extracts features, scores it, and saves the result.
    """
    # Load image
    # image = cv2.imread(image_path)

    # if image is None:
    #     print("Error: Image not found. Check path:", image_path)
    #     return None

    # print("Processing image:", image_path)

    # Extract features
    opVis, opFeatures = compute_clock_features(image_path)

    if opFeatures is None:
        print("Error: Could not detect valid clock face.")
        return None

    # Score the clock drawing
    score_df = evaluate_clock_drawing(opFeatures)

    # Convert to RGB before displaying
    vis_rgb = cv2.cvtColor(opVis, cv2.COLOR_BGR2RGB)

    # Display the processed image
    # plt.imshow(vis_rgb)
    # plt.axis("off")  # Hide axes
    # plt.show()

    return score_df, opFeatures


# Construct the path to 50.jpg
# image_path = os.path.join(script_dir, "data/sample_images/50.jpg")


if __name__ == "__main__":
    db_util = DatabaseUtil()

    try:
        db_util.SessionFactory()
        print("Database connection is active.")
    except Exception as e:
        print(f"Failed to establish connection: {e}")

    df = db_util.extract_data("cdt")


    image_id = int(df["actual_responses"].iloc[0][0])

    # print(image_id)

    image = db_util.fetch_image(image_id)

    # df_result, df_extract = process_single_image(image)

    # print(df_result)

    # Convert blob (binary) data to a NumPy array
    image_np = np.frombuffer(image, np.uint8)

    # Decode it into an OpenCV image
    image_cv2 = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    df_result, df_extract = process_single_image(image_cv2)

    score = [df_result["Contour"].iloc[0], df_result["Numbers"].iloc[0], df_result["Hand_Length"].iloc[0], df_result["Hand_Centering"].iloc[0]]

    extracted_responses = [str(num) for num in score]

    aggregated_score = sum(score)
    subtest_id = int(df["subtest_id"].iloc[0])

    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)

    print(df_result)
    