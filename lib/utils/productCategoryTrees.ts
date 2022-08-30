import { ProductCategory } from "@prisma/client";
import type { ProductCategoryTree } from "lib/interfaces/IProductCategoryTree";

export const productCategoryListToTree = (categories: ProductCategory[]): ProductCategoryTree[] => {
    const list = [...categories] as ProductCategoryTree[];
    const map = {};
    const roots = [];
    let node: ProductCategoryTree;
    let i: number;

    for (i = 0; i < list.length; i++) {
        map[categories[i].id] = i; // initialize the map
        list[i].children = []; // initialize the children of each category
    }

    for (i = 0; i < list.length; i++) {
        node = list[i];
        if (node.parentId !== null) {
            // if you have dangling branches check that map[node.parentId] exists
            list[map[node.parentId]].children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
};

export const productCategoryTreeToList = (
    root: ProductCategoryTree
): (ProductCategory & { _count?: { products: number } })[][] => {
    const res: ProductCategory[][] = [];
    BFS(root, 0);
    return res;

    function BFS(node: ProductCategoryTree, depth: number) {
        if (!node) return;
        if (depth === res.length) {
            res.push([]);
        }
        res[depth].push(node);
        for (const child of node.children) {
            BFS(child, depth + 1);
        }
    }
};

export const productCategorySubTree = (
    level: ProductCategoryTree[],
    matchField: "id" | "name",
    matchValue: string
): ProductCategoryTree | null => {
    let result = null;

    for (const node of level) {
        if (result !== null) {
            break;
            // result was found in a siblings descendents,
            // break to avoid overwriting with node's children
        }
        if (node[matchField] === matchValue) {
            result = node;
            break;
        } else if (node.children.length > 0) {
            result = productCategorySubTree(node.children, matchField, matchValue);
        }
    }

    return result;
};
