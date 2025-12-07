import axios from "axios";
const updateData = async () => {
  const data = {
    id: 615063,  // ID của node cần cập nhật
    pid: 67890,
    stpid: null,
    name: "New Name",
    title: "New Title",
    photo: "new_photo_url",
    tags: ["tag1", "tag2"],
    orig_pid: 123,
    dept: "HR",
    BU: "Sales",
    type: "Employee",
  };

  try {
    const response = await axios.post("https://script.google.com/macros/s/AKfycbwpHToyrox_2EpX63MQ16wvbTmDxdGX5qJgZi0_IN-dSp_W07PqAsBCFVCem69cdXQLaw/exec", data);
    console.log(response.data);
  } catch (error) {
    console.error("Error updating data:", error);
  }
};
