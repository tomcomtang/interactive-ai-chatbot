/**
 * A2UI Mock 数据 - 用于测试和演示
 */

// 1. 用户个人资料卡片
export const userProfileExample = [
  {
    type: 'createSurface',
    surfaceId: 'profile-card',
    dataModel: {
      user: {
        name: 'Alex Chen',
        title: 'Senior Product Designer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        email: 'alex.chen@example.com',
        location: 'San Francisco, CA',
        bio: 'Passionate about creating delightful user experiences. Love coffee, travel, and good design.',
        stats: {
          projects: 42,
          followers: 1234,
          following: 567
        }
      }
    },
    components: [
      {
        type: 'Card',
        id: 'profile-card-main',
        elevation: 2,
        children: [
          {
            type: 'Row',
            id: 'profile-header',
            alignment: 'start',
            children: [
              {
                type: 'Image',
                id: 'avatar',
                url: '/user/avatar',
                dataBinding: '/user/avatar',
                width: '80px',
                height: '80px'
              },
              {
                type: 'Column',
                id: 'profile-info',
                alignment: 'start',
                children: [
                  {
                    type: 'Text',
                    id: 'name',
                    text: '/user/name',
                    dataBinding: '/user/name',
                    size: 'extraLarge',
                    style: { fontWeight: '600' }
                  },
                  {
                    type: 'Text',
                    id: 'title',
                    text: '/user/title',
                    dataBinding: '/user/title',
                    size: 'medium',
                    style: { color: 'rgba(255, 255, 255, 0.7)' }
                  }
                ]
              }
            ]
          },
          {
            type: 'Divider',
            id: 'divider-1',
            direction: 'horizontal'
          },
          {
            type: 'Column',
            id: 'profile-details',
            alignment: 'start',
            children: [
              {
                type: 'Text',
                id: 'bio',
                text: '/user/bio',
                dataBinding: '/user/bio',
                size: 'medium'
              },
              {
                type: 'Text',
                id: 'email',
                text: '/user/email',
                dataBinding: '/user/email',
                size: 'small',
                style: { color: 'rgba(255, 255, 255, 0.6)' }
              },
              {
                type: 'Text',
                id: 'location',
                text: '/user/location',
                dataBinding: '/user/location',
                size: 'small',
                style: { color: 'rgba(255, 255, 255, 0.6)' }
              }
            ]
          },
          {
            type: 'Divider',
            id: 'divider-2',
            direction: 'horizontal'
          },
          {
            type: 'Row',
            id: 'stats',
            alignment: 'spaceAround',
            children: [
              {
                type: 'Column',
                id: 'stat-projects',
                alignment: 'center',
                children: [
                  {
                    type: 'Text',
                    id: 'projects-count',
                    text: '/user/stats/projects',
                    dataBinding: '/user/stats/projects',
                    size: 'large',
                    style: { fontWeight: '600' }
                  },
                  {
                    type: 'Text',
                    id: 'projects-label',
                    text: 'Projects',
                    size: 'small',
                    style: { color: 'rgba(255, 255, 255, 0.6)' }
                  }
                ]
              },
              {
                type: 'Column',
                id: 'stat-followers',
                alignment: 'center',
                children: [
                  {
                    type: 'Text',
                    id: 'followers-count',
                    text: '/user/stats/followers',
                    dataBinding: '/user/stats/followers',
                    size: 'large',
                    style: { fontWeight: '600' }
                  },
                  {
                    type: 'Text',
                    id: 'followers-label',
                    text: 'Followers',
                    size: 'small',
                    style: { color: 'rgba(255, 255, 255, 0.6)' }
                  }
                ]
              },
              {
                type: 'Column',
                id: 'stat-following',
                alignment: 'center',
                children: [
                  {
                    type: 'Text',
                    id: 'following-count',
                    text: '/user/stats/following',
                    dataBinding: '/user/stats/following',
                    size: 'large',
                    style: { fontWeight: '600' }
                  },
                  {
                    type: 'Text',
                    id: 'following-label',
                    text: 'Following',
                    size: 'small',
                    style: { color: 'rgba(255, 255, 255, 0.6)' }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// 2. 联系表单
export const contactFormExample = [
  {
    type: 'createSurface',
    surfaceId: 'contact-form',
    dataModel: {
      form: {
        name: '',
        email: '',
        message: '',
        subscribe: false
      }
    },
    components: [
      {
        type: 'Card',
        id: 'form-card',
        elevation: 2,
        children: [
          {
            type: 'Text',
            id: 'form-title',
            text: 'Contact Us',
            size: 'extraLarge',
            style: { fontWeight: '600' }
          },
          {
            type: 'Text',
            id: 'form-desc',
            text: 'Fill out the form below and we\'ll get back to you soon.',
            size: 'medium',
            style: { color: 'rgba(255, 255, 255, 0.7)' }
          },
          {
            type: 'Divider',
            id: 'form-divider',
            direction: 'horizontal'
          },
          {
            type: 'TextField',
            id: 'name-field',
            label: 'Name',
            placeholder: 'Enter your name',
            dataBinding: '/form/name'
          },
          {
            type: 'TextField',
            id: 'email-field',
            label: 'Email',
            placeholder: 'your.email@example.com',
            dataBinding: '/form/email'
          },
          {
            type: 'TextField',
            id: 'message-field',
            label: 'Message',
            placeholder: 'Tell us what you think...',
            multiline: true,
            dataBinding: '/form/message'
          },
          {
            type: 'CheckBox',
            id: 'subscribe-check',
            label: 'Subscribe to our newsletter',
            dataBinding: '/form/subscribe'
          },
          {
            type: 'Row',
            id: 'form-actions',
            alignment: 'end',
            children: [
              {
                type: 'Button',
                id: 'cancel-btn',
                text: 'Cancel',
                variant: 'outlined',
                action: {
                  name: 'cancel',
                  data: {}
                }
              },
              {
                type: 'Button',
                id: 'submit-btn',
                text: 'Send Message',
                variant: 'primary',
                action: {
                  name: 'submit',
                  data: { formId: 'contact-form' }
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

// 3. 产品列表
export const productListExample = [
  {
    type: 'createSurface',
    surfaceId: 'product-list',
    dataModel: {
      products: [
        {
          id: 1,
          name: 'Wireless Headphones',
          price: '$99.99',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
          rating: 4.5
        },
        {
          id: 2,
          name: 'Smart Watch',
          price: '$299.99',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
          rating: 4.8
        },
        {
          id: 3,
          name: 'Laptop Stand',
          price: '$49.99',
          image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop',
          rating: 4.3
        }
      ]
    },
    components: [
      {
        type: 'Column',
        id: 'product-list-container',
        alignment: 'start',
        children: [
          {
            type: 'Text',
            id: 'list-title',
            text: 'Featured Products',
            size: 'extraLarge',
            style: { fontWeight: '600' }
          },
          {
            type: 'Row',
            id: 'products-row',
            alignment: 'start',
            children: [
              {
                type: 'Card',
                id: 'product-card-1',
                elevation: 1,
                children: [
                  {
                    type: 'Column',
                    id: 'product-1-content',
                    alignment: 'start',
                    children: [
                      {
                        type: 'Image',
                        id: 'product-image-1',
                        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
                        width: '100%',
                        height: '150px'
                      },
                      {
                        type: 'Text',
                        id: 'product-name-1',
                        text: 'Wireless Headphones',
                        size: 'large',
                        style: { fontWeight: '600' }
                      },
                      {
                        type: 'Text',
                        id: 'product-price-1',
                        text: '$99.99',
                        size: 'medium',
                        style: { color: '#6633ee', fontWeight: '500' }
                      },
                      {
                        type: 'Button',
                        id: 'add-to-cart-1',
                        text: 'Add to Cart',
                        variant: 'primary',
                        action: {
                          name: 'addToCart',
                          data: { productId: 1 }
                        }
                      }
                    ]
                  }
                ]
              },
              {
                type: 'Card',
                id: 'product-card-2',
                elevation: 1,
                children: [
                  {
                    type: 'Column',
                    id: 'product-2-content',
                    alignment: 'start',
                    children: [
                      {
                        type: 'Image',
                        id: 'product-image-2',
                        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
                        width: '100%',
                        height: '150px'
                      },
                      {
                        type: 'Text',
                        id: 'product-name-2',
                        text: 'Smart Watch',
                        size: 'large',
                        style: { fontWeight: '600' }
                      },
                      {
                        type: 'Text',
                        id: 'product-price-2',
                        text: '$299.99',
                        size: 'medium',
                        style: { color: '#6633ee', fontWeight: '500' }
                      },
                      {
                        type: 'Button',
                        id: 'add-to-cart-2',
                        text: 'Add to Cart',
                        variant: 'primary',
                        action: {
                          name: 'addToCart',
                          data: { productId: 2 }
                        }
                      }
                    ]
                  }
                ]
              },
              {
                type: 'Card',
                id: 'product-card-3',
                elevation: 1,
                children: [
                  {
                    type: 'Column',
                    id: 'product-3-content',
                    alignment: 'start',
                    children: [
                      {
                        type: 'Image',
                        id: 'product-image-3',
                        url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop',
                        width: '100%',
                        height: '150px'
                      },
                      {
                        type: 'Text',
                        id: 'product-name-3',
                        text: 'Laptop Stand',
                        size: 'large',
                        style: { fontWeight: '600' }
                      },
                      {
                        type: 'Text',
                        id: 'product-price-3',
                        text: '$49.99',
                        size: 'medium',
                        style: { color: '#6633ee', fontWeight: '500' }
                      },
                      {
                        type: 'Button',
                        id: 'add-to-cart-3',
                        text: 'Add to Cart',
                        variant: 'primary',
                        action: {
                          name: 'addToCart',
                          data: { productId: 3 }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// 4. 设置面板
export const settingsPanelExample = [
  {
    type: 'createSurface',
    surfaceId: 'settings-panel',
    dataModel: {
      settings: {
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        volume: 75
      }
    },
    components: [
      {
        type: 'Card',
        id: 'settings-card',
        elevation: 2,
        children: [
          {
            type: 'Text',
            id: 'settings-title',
            text: 'Settings',
            size: 'extraLarge',
            style: { fontWeight: '600' }
          },
          {
            type: 'Divider',
            id: 'divider-1',
            direction: 'horizontal'
          },
          {
            type: 'Text',
            id: 'notifications-title',
            text: 'Notifications',
            size: 'large',
            style: { fontWeight: '500' }
          },
          {
            type: 'CheckBox',
            id: 'email-notif',
            label: 'Email notifications',
            dataBinding: '/settings/notifications/email'
          },
          {
            type: 'CheckBox',
            id: 'push-notif',
            label: 'Push notifications',
            dataBinding: '/settings/notifications/push'
          },
          {
            type: 'CheckBox',
            id: 'sms-notif',
            label: 'SMS notifications',
            dataBinding: '/settings/notifications/sms'
          },
          {
            type: 'Divider',
            id: 'divider-2',
            direction: 'horizontal'
          },
          {
            type: 'Text',
            id: 'volume-title',
            text: 'Volume',
            size: 'large',
            style: { fontWeight: '500' }
          },
          {
            type: 'Slider',
            id: 'volume-slider',
            min: 0,
            max: 100,
            step: 1,
            dataBinding: '/settings/volume'
          },
          {
            type: 'Divider',
            id: 'divider-3',
            direction: 'horizontal'
          },
          {
            type: 'Row',
            id: 'settings-actions',
            alignment: 'end',
            children: [
              {
                type: 'Button',
                id: 'save-btn',
                text: 'Save Settings',
                variant: 'primary',
                action: {
                  name: 'saveSettings',
                  data: {}
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

// 导出所有示例
export const allMockExamples = {
  userProfile: userProfileExample,
  contactForm: contactFormExample,
  productList: productListExample,
  settingsPanel: settingsPanelExample
};
