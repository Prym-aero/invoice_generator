export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "my_unsigned_preset"); // Replace with your preset
    formData.append("cloud_name", "duyxiulgp");         // Replace with your name
    formData.append("resource_type", "raw");

    const response = await fetch(`https://api.cloudinary.com/v1_1/duyxiulgp/raw/upload`, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!data.secure_url) throw new Error("Cloudinary upload failed");

    return data.secure_url;
};
