import { productCategoriesSubTree } from "/lib/utils/productCategoriesSubTree";
import { productCategoriesListToTree } from "/lib/utils/productCategoriesListToTree";
import { prisma } from "/lib/prisma";

const getProductCategoryTree = async () => {
    const productCategories = await prisma.productCategory.findMany();
    const productCategoryTree = productCategoriesListToTree(productCategories);
    return productCategoryTree;
};

const productCategoryTree = getProductCategoryTree();

test("subtree Necklaces is returned", () => {
    expect(productCategoriesSubTree(productCategoryTree, "name", "Necklaces")).toB;
});
