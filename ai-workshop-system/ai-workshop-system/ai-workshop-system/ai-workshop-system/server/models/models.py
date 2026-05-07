from tensorflow.keras.preprocessing import image
import numpy as np
import cv2
import matplotlib.pyplot as plt
img_path = "../input/car-damage-detection/data1a/training/01-whole/0062.jpg"
img = image.load_img(img_path, target_size=(224, 224))
img_array = image.img_to_array(img)
img_batch = np.expand_dims(img_array, axis=0)


im = cv2.imread(img_path)
im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
plt.axis("off")
plt.imshow(im)

pred=MobileNet.predict(img_batch)
print("Car is Damaged: "+str(pred[0][0])+", Car is not Damaged: "+str(pred[0][1]))
if pred[0][0]<pred[0][1]:
    print("The car is not damaged")
else:
    print("The car is damaged")