// ৪. প্রতিটি ফাইলের সাথে আন্ডারস্কোর আইডি ম্যাচ করে সঠিক ছবি ও টাইটেল সেট করা
                for (let i = 0; i < validFiles.length; i++) {
                    let file = validFiles[i];
                    
                    let { data: pubFile } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(`${catName}/${file.name}`);
                    let downloadUrl = pubFile ? pubFile.publicUrl : "";
                    
                    let commitTime = file.updated_at ? new Date(file.updated_at).getTime() : 0;
                    
                    let fileDateStr = "";
                    if (commitTime > 0) {
                        let cDate = new Date(commitTime);
                        fileDateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
                    }

                    let isToday = (fileDateStr === todayStr);

                    // ফাইলের নামের শেষের আন্ডারস্কোর আইডি বের করা
                    let fileHashId = extractHashId(file.name);
                    let matchedImgObj = (fileHashId && imagesMap[fileHashId]) ? imagesMap[fileHashId] : null;

                    // যদি আইডি দিয়ে সরাসরি ম্যাচ না করে, তবে ফোল্ডারের ইনডেক্স অনুযায়ী ছবি মেলানো (যাতে কোনো ফাইল ছবি ছাড়া না থাকে)
                    if (!matchedImgObj && imagesList.length > 0) {
                        let fallbackImg = imagesList[i % imagesList.length];
                        let { data: pubFallback } = supabase.storage
                            .from(STORAGE_BUCKET)
                            .getPublicUrl(`${catName}/images/${fallbackImg.name}`);

                        matchedImgObj = {
                            name: fallbackImg.name,
                            url: pubFallback ? pubFallback.publicUrl : ""
                        };
                    }

                    let matchedImgUrl = matchedImgObj ? matchedImgObj.url : "";
                    
                    // সুন্দর টাইটেল তৈরির লজিক: ছবির নাম থাকলে ছবির নাম থেকে, না থাকলে ফাইলের নাম থেকে পরিষ্কার টাইটেল বানাবে
                    let rawNameToClean = matchedImgObj ? matchedImgObj.name : file.name;
                    let nameWithoutExt = rawNameToClean.replace(/\.[^/.]+$/, "");
                    let cleanBaseName = nameWithoutExt.replace(/_[a-zA-Z0-9]+$/, "");
                    let titleText = cleanBaseName.replace(/[-_]/g, " ").trim();

                    let extMatch = file.name.match(/\.[^/.]+$/);
                    let fileExt = extMatch ? extMatch[0] : "";
                    let nameWithoutFileExt = file.name.replace(/\.[^/.]+$/, "");
                    let cleanFileName = nameWithoutFileExt.replace(/_[a-zA-Z0-9]+$/, "") + fileExt;

                    collectedFiles.push({
                        name: file.name,
                        displayName: cleanFileName,
                        download_url: downloadUrl,
                        category: catName,
                        image: matchedImgUrl,
                        title: titleText || "Live Stream",
                        timestamp: commitTime,
                        isNew: isToday
                    });
                }
