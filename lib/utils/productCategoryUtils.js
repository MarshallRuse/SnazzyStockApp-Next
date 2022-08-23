export const findNestedCategory = (cats, catID) => {
    let foundCat;
    for (let i = 0; i < cats.length; i++){
        if (cats[i].Product_Category_ID === catID){
            foundCat = cats[i];
            return foundCat;
        } else if (cats[i].children.length > 0){
            foundCat = findNestedCategory(cats[i].children, catID);
        }
        if (foundCat !== undefined){
            break;
        }
    }
    return foundCat;
}



export const nestCategories = (cats) => {
    // it is assumed that the first element will be as close as possible to the 
    // root for this level, as the categories are ordered by their Left values.
    // Note that there may be multiple elements on this level - the first element can
    // have siblings

    let thisLevel = [];
    thisLevel.push({
        ...cats[0],
        collapseOpen: false,
        children: []
    });
    let thisLevelIndex = 0;

    // find how many direct descendents a parent has
    let i = 0;
    let j = 1;
    while (i < cats.length){
        while (i+j < cats.length && cats[i+j].rgt < cats[i].rgt){ // any descendents will have a smaller Right value
            
            thisLevel[thisLevelIndex].children.push({
                ...cats[i+j],
                collapseOpen: false,
                children: []
            });
            j++;
        }
        i = i+j;  //catch i up to j
        j = 1; // reset j
        // do the same to thisLevel's element's children
        if (thisLevel[thisLevelIndex].lft !== thisLevel[thisLevelIndex].rgt - 1){
            thisLevel[thisLevelIndex].children = nestCategories(thisLevel[thisLevelIndex].children);
        }
        

        if (i < cats.length){ // ie. not all elements passed in are children, there are siblings
            thisLevelIndex++;
            thisLevel.push({
                ...cats[i],
                collapseOpen: false,
                children: []
            })
        }
    }
    return thisLevel;
}

export const sortNestedCategories = (cats) => {
    cats.sort((a,b) => (a.Product_Category_Name > b.Product_Category_Name ? 1 : (b.Product_Category_Name > a.Product_Category_Name ? -1 : 0)));

    for (let i = 0; i < cats.length; i++){
        sortNestedCategories(cats[i].children);
    }
}