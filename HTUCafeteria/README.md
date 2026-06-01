# 🍽️ Expert HTU Cafeteria

A full-featured food ordering platform for Ho Technical University (HTU) Cafeteria built with React Native, Expo, and TypeScript. Students can browse authentic Ghanaian cuisine, place orders seamlessly, track deliveries in real-time, and manage their food preferences—all while admins handle menu and order management through an intuitive dashboard.

## 📋 Features

### 👨‍🎓 For Students & Customers
- **Browse Menu**: Explore diverse Ghanaian dishes with detailed descriptions, ratings, and preparation times
- **Smart Cart**: Add items, customize quantities, and add special notes to orders
- **Multiple Payment Options**: Pay via mobile money (MoMo) or cash on delivery
- **Order Tracking**: Real-time status updates (pending → preparing → ready → delivered)
- **Notifications**: Get alerts for order updates and special promotions
- **Order History**: View past orders and reorder favorites
- **User Profile**: Manage personal information and preferences
- **Category Filtering**: Browse by rice dishes, soups, fast food, snacks, drinks, breakfast, etc.

### 👨‍💼 For Admins
- **Dashboard**: Complete overview of orders and menu analytics
- **Menu Management**: Add, edit, and remove food items with pricing and availability
- **Order Management**: Monitor incoming orders, update statuses, and track deliveries
- **Inventory Control**: Mark items as available/unavailable in real-time

### 🎯 General Features
- **Authentication**: Secure login for students and admin staff
- **Onboarding**: Smooth first-time user experience with guided setup
- **Dark Mode Support**: Automatic theme adaptation based on device settings
- **Responsive Design**: Optimized for iOS, Android, and Web platforms
- **State Management**: Zustand for efficient global state management
- **File-based Routing**: Modern app navigation with Expo Router

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and managed hosting
- **TypeScript** - Type-safe development
- **Expo Router** - File-based routing system
- **Zustand** - Lightweight state management
- **React Native Gesture Handler** - Smooth gesture interactions
- **React Native Reanimated** - Fluid animations
- **Expo Vector Icons** - Beautiful icon library

## 📁 Project Structure

```
HTUCafeteria/
├── src/
│   ├── app/                  # Main app screens and routing
│   │   ├── (auth)           # Authentication screens (login, register)
│   │   ├── (tabs)           # Tab-based navigation (menu, orders, profile)
│   │   ├── (admin)          # Admin-only screens (dashboard, manage)
│   │   ├── cart.tsx         # Shopping cart screen
│   │   ├── checkout.tsx     # Checkout & payment screen
│   │   └── order-success.tsx # Order confirmation
│   ├── components/           # Reusable UI components
│   │   ├── CartItem.tsx
│   │   ├── FoodCard.tsx
│   │   ├── OrderCard.tsx
│   │   └── ui/              # Base UI components
│   ├── store/               # State management
│   │   ├── authStore.ts
│   │   └── cartStore.ts
│   ├── constants/           # App constants
│   │   ├── Colors.ts
│   │   ├── data.ts          # Menu items and mock data
│   │   └── theme.ts
│   └── hooks/               # Custom React hooks
├── assets/                  # Images, icons, and media
└── package.json            # Dependencies

```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rocksonowusu/ExpertCateringServices_HTU.git
   cd HTUCafeteria
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device or emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web
   - Scan QR code with Expo Go app (physical device)

## 📱 Mock Credentials

### Student Login
- **Email**: `student@htu.edu.gh`
- **Password**: `password123`

### Admin Login
- **Email**: `admin@htu.edu.gh`
- **Password**: `admin123`

## 🔧 Development

### Run with Development Build
```bash
npx expo run:android
npx expo run:ios
```

### Lint & Format
```bash
npx expo lint
```

### Reset Project
```bash
npm run reset-project
```

## 📦 Build & Deployment

### Build APK (Android)
```bash
eas build --platform android
```

### Build IPA (iOS)
```bash
eas build --platform ios
```

### Deploy to Expo
```bash
eas submit --platform android
eas submit --platform ios
```

## 🎨 Customization

### Update Colors
Edit [src/constants/Colors.ts](src/constants/Colors.ts) to customize the app theme.

### Add Menu Items
Modify [src/constants/data.ts](src/constants/data.ts) to add new food items.

### Update University Branding
- Change app name in `app.json`
- Update logo in `assets/images/`
- Modify brand colors in `src/constants/Colors.ts`

## 📝 API Integration (Future)

The app is currently using mock data. To connect to a backend:

1. Replace mock API calls in `src/store/authStore.ts` and `src/store/cartStore.ts`
2. Implement API endpoints for:
   - User authentication
   - Menu retrieval
   - Order placement & tracking
   - Payment processing

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Rockson Kwesi Owusu

## 📧 Support

For questions, issues, or suggestions, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ for HTU Community**
