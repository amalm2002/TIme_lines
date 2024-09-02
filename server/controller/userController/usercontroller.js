const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const Wishlist = require('..//../model/user/wishlistModel')
const CategoryOffer = require('../../model/admin/categoryOfferModel')

const renderHome = async (req, res) => {
    const userId = req.session.user ? req.session.user._id : req.session.userNotAuthenticated?.id;
    const user = await User.findOne({ _id: userId })


    // const products = await Product.find({ status: 'Active' })
    const products = await Product.aggregate([{
        $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryDetails'
        }
    },
    {
        $unwind: '$categoryDetails'
    },
    {
        $match: {
            'status': 'Active',
            'categoryDetails.status': 'Active'
        }
    }
    ])

    const currentDate = new Date();
    const categoryOffers = await CategoryOffer.find({ endDate: { $gte: currentDate } })
        .populate('categoryId');

    const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;

    const newArrivals = []
    const allProducts = []
    for (let i = products.length - 1; i >= 0; i--) {
        if (newArrivals.length < 4) {
            newArrivals.push(products[i])
        } else {
            allProducts.unshift(products[i])
        }

    }

    let wishlistProducts = [];
    if (userId) {
        const wishlist = await Wishlist.findOne({ userId }).populate('products');
        if (wishlist) {
            wishlistProducts = wishlist.products.map(product => product._id.toString());
        }
    }
    res.render('user/index', { user, newArrivals, allProducts, wishlistProducts, categoryOffer });
}

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user._id : req.session.userNotAuthenticated?.id;
        const productId = req.params.id;

        const product = await Product.findById(productId).populate("brand").populate('category');

        if (!product || (product.category && product.category.status !== 'Active')) {
            return res.status(404).render('user/productDetails', {
                error: 'Product not found or category is not active',
                products: null, 
                relatedProducts: [],
                user: userId ? await User.findById(userId) : null,
                wishlistProducts: [],
                categoryOffer: null
            });
        }

        const relatedProducts = await Product.find({
            _id: { $ne: productId },
            category: product.category._id 
        }).limit(4);

        let wishlistProducts = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId }).populate('products');
            if (wishlist) {
                wishlistProducts = wishlist.products.map(product => product._id.toString());
            }
        }

        // Get active category offers
        const currentDate = new Date();
        const categoryOffers = await CategoryOffer.find({ endDate: { $gte: currentDate } })
            .populate('categoryId');

        const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;

        res.render('user/productDetails', {
            products: product,
            relatedProducts,
            user: userId ? await User.findById(userId) : null,
            wishlistProducts,
            categoryOffer
        });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).render('user/productDetails', {
            error: 'Server error',
            products: null, 
            relatedProducts: [],
            user: userId ? await User.findById(userId) : null,
            wishlistProducts: [],
            categoryOffer: null
        });
    }
};



const productListPage = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user._id : req.session.userNotAuthenticated?.id;
        const user = await User.findOne({ _id: userId })
        const category = await Category.find({ status: 'Active' });
        // const products = await Product.find({ status: 'Active' });
        const products = await Product.aggregate([{
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        {
            $unwind: '$categoryDetails'
        },
        {
            $match: {
                'status': 'Active',
                'categoryDetails.status': 'Active'
            }
        }
        ]);
        const brand = await Brand.find();

        const searchQuery = req.query.search || '';
        const selectCategories = req.query.categories ? req.query.categories.split(',') : [];
        const selectBrand = req.query.brands ? req.query.brands.split(',') : [];

        let filterProducts = products.filter(pro => {
            const matchSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCategories = selectCategories.length === 0 || selectCategories.includes(pro.category.toString());
            const matchBrand = selectBrand.length === 0 || selectBrand.includes(pro.brand.toString());

            return matchSearch && matchCategories && matchBrand;
        });

        let wishlistProducts = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId }).populate('products');
            if (wishlist) {
                wishlistProducts = wishlist.products.map(product => product._id.toString());
            }
        }

        const currentDate = new Date();
        const categoryOffers = await CategoryOffer.find({ endDate: { $gte: currentDate } })
            .populate('categoryId');

        const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;

        res.render('user/productPage', { user: user, products: filterProducts, category, brand, searchQuery, selectBrand, selectCategories, wishlistProducts, categoryOffer });
    } catch (error) {
        console.error('The error is shown on productListPage controller:', error);
    }
};

const filterProducts = async (req, res) => {
    try {
        // console.log('Received filter data:', req.body);
        const { categories, brands, priceRanges, sort, maxPrice } = req.body;
        const query = { status: 'Active' };

        if (categories.length) {
            query.category = { $in: categories };
        }

        if (brands.length) {
            query.brand = { $in: brands };
        }

        if (priceRanges.length) {
            query.$or = priceRanges.map(range => {
                const [min, max] = range.split('-').map(Number);
                return { price: { $gte: min, $lte: max } };
            });
        }

        if (maxPrice) {
            query.price = { $lte: Number(maxPrice) }
        }

        const sortQuery = {}
        if (sort) {
            switch (sort) {
                case 'price-asc':
                    sortQuery.price = 1
                    break;
                case 'price-desc':
                    sortQuery.price = -1
                    break;
                case 'name-asc':
                    sortQuery.name = 1
                    break;
                case 'name-desc':
                    sortQuery.name = -1
                    break;
                default:
                    break;
            }
        }

        const products = await Product.find(query).sort(sortQuery);
        res.json({ products });
    } catch (error) {
        console.error('The error occurred in filterProducts:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    renderHome,
    productDetails,
    productListPage,
    filterProducts,

};




