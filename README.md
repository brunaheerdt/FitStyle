# FitStyle - Brazilian Fitness Fashion Community

A community-driven platform for Brazilian fitness fashion enthusiasts in Ireland. Discover authentic Brazilian activewear, connect with the community, and share your fitness style.

## 🌟 Features

### 🛍️ Product Discovery
- Browse authentic Brazilian fitness wear from trusted brands like DLK Modas
- High-quality product images and detailed descriptions
- Filter by brand, size, color, and price
- Product reservation system with comment count display

### 💬 Community Engagement
- **Nested Comments System** - Up to 3 levels of threaded discussions
- User authentication and profile management
- Product reviews and community feedback
- Real-time reservation notifications

### 🔐 User Management
- Secure user registration and authentication
- Role-based access control (Users and Admins)
- Personal profile with reservation history
- Admin panel for content moderation

### 🎛️ Admin Features
- Product management (CRUD operations)
- User management and role assignment
- Comment moderation system
- Reservation tracking
- Comprehensive admin dashboard

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database with proper indexing
- **bcrypt** for password hashing
- **JWT** for authentication
- RESTful API architecture

### Frontend
- **Vanilla JavaScript** SPA (Single Page Application)
- **Handlebars.js** templating engine
- **CSS Grid & Flexbox** for responsive design
- Client-side routing
- Template-based component system

### Database Schema
- **Users**: Authentication and profile management
- **Products**: Brazilian fitness wear catalog
- **Comments**: Nested comment system with 3-level threading
- **Reservations**: Product reservation tracking

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fitstyle
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
The application uses SQLite and will automatically create the database on first run. The database file will be created as `database.db` in the project root.

### 4. Environment Configuration
Create a `.env` file in the root directory (optional - defaults will work):
```env
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 5. Start the Application
```bash
npm start
```

The application will be available at: `http://localhost:3000`

## 🎯 Usage

### For Users
1. **Browse Products**: Visit the homepage to see all available Brazilian fitness wear
2. **View Details**: Click on any product to see full details, images, and community comments
3. **Register/Login**: Create an account to participate in discussions and register interest
4. **Comment & Reply**: Join conversations with up to 3 levels of nested replies
5. **Make Reservations**: Reserve products to be contacted by sellers

### For Admins
1. **Access Admin Panel**: Login with admin credentials and navigate to `/admin`
2. **Manage Products**: Add, edit, or remove products from the catalog
3. **Moderate Comments**: Approve, reject, or flag user comments
4. **Manage Users**: View user statistics, change roles, activate/deactivate accounts
5. **Track Reservations**: Monitor customer reservations and update statuses

### Default Admin Account
- **Email**: `admin@fitstyle.com`
- **Password**: `admin123`
- **Role**: Administrator

## 🗂️ Project Structure

```
fitstyle/
├── src/
│   ├── models/           # Database models
│   │   ├── User.js       # User authentication & management
│   │   ├── Product.js    # Product catalog management
│   │   ├── Comment.js    # Nested comments system
│   │   └── database.js   # Database connection & setup
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Authentication routes
│   │   ├── products.js   # Product management routes
│   │   ├── comments.js   # Comment system routes
│   │   └── reservations.js # Product reservation routes
│   ├── middleware/       # Express middleware
│   │   └── auth.js       # JWT authentication middleware
│   └── server.js         # Main server file
├── public/
│   ├── css/
│   │   └── styles.css    # Complete application styling
│   ├── js/
│   │   ├── app.js        # Main application logic
│   │   └── templateManager.js # Handlebars template system
│   ├── templates/        # Handlebars templates
│   │   ├── product-details-page.html
│   │   ├── comment-item.html
│   │   ├── reply-form.html
│   │   └── [other templates]
│   └── index.html        # SPA entry point
├── package.json          # Dependencies and scripts
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🛠️ Development

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart (if nodemon is installed)
- `npm test` - Run tests (when implemented)

### Adding New Products
Products can be added through:
1. **Admin Panel**: Login as admin and use the product management interface
2. **API**: POST to `/api/products` with product data
3. **Script**: Run the included `create-test-products.js` for sample Brazilian products

### Database Migrations
If you need to modify the database schema:
1. Create a migration script in the project root
2. Follow the pattern used in `migrate-comments.js`
3. Run the migration before starting the application

## 🎨 Design Features

### Brazilian Theme
- Color scheme inspired by Brazilian fashion
- Yellow accent colors representing Brazilian energy
- Green elements reflecting Brazilian nature
- Modern, clean design with Brazilian flair

### Responsive Design
- Mobile-first CSS approach
- Flexible grid layouts
- Touch-friendly interface
- Optimized for all screen sizes

### Nested Comments
- Visual indentation for reply levels
- Color-coded comment levels (blue → green → orange)
- Connection lines showing reply relationships
- Automatic nesting level management

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Content sanitization
- **CORS Configuration**: Controlled cross-origin requests
- **Role-based Access**: Admin vs User permissions

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product with comments
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Comments
- `GET /api/comments/product/:id` - Get nested comments for product
- `POST /api/comments` - Create comment or reply
- `PATCH /api/comments/:id/moderate` - Moderate comment (Admin only)
- `DELETE /api/comments/:id` - Delete comment

### Reservations
- `POST /api/reservations` - Make product reservation
- `GET /api/reservations` - Get user's registrations
- `GET /api/reservations/all` - Get all registrations (Admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- [ ] Payment integration for direct purchases
- [ ] WhatsApp integration for seller contact
- [ ] Image upload for user-generated content
- [ ] Email notifications for reservations
- [ ] Advanced search and filtering
- [ ] Wishlist functionality
- [ ] Social media integration
- [ ] Multi-language support (PT/EN)
- [ ] Mobile app development

## 🐛 Known Issues

- None currently reported

## 📞 Support

For support, email bruna@heerdt.com.br or join our community discussions.

---

**Built with ❤️ for the Brazilian fitness community in Ireland** 🇧🇷🇮🇪
