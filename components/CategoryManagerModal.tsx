import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, Edit2, Plus, Check, Lock, Unlock, Palette, Square, CheckSquare } from 'lucide-react';
import { Category } from '../types';
import Icon from './Icon';
import IconSelector from './IconSelector';
import CategoryActionAuthModal from './CategoryActionAuthModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
  onDeleteCategory: (id: string) => void;
  onVerifyPassword?: (password: string) => Promise<boolean>;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  onDeleteCategory,
  onVerifyPassword
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatPassword, setNewCatPassword] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Folder');

  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [iconSelectorTarget, setIconSelectorTarget] = useState<'edit' | 'new' | null>(null);

  // 多选模式状态
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // 分类操作验证相关状态
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete' | 'batchDelete';
    categoryId?: string;
    categoryName?: string;
    categoryIds?: string[];
  } | null>(null);

  if (!isOpen) return null;

  // 切换多选模式
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedCategories(new Set()); // 清空选中
  };

  // 切换分类选中状态
  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCategories.size === categories.filter(c => c.id !== 'common').length) {
      // 已全选,取消全选
      setSelectedCategories(new Set());
    } else {
      // 全选所有非"常用推荐"的分类
      const allIds = new Set(categories.filter(c => c.id !== 'common').map(c => c.id));
      setSelectedCategories(allIds);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedCategories.size === 0) {
      alert('请先选择要删除的分类');
      return;
    }

    if (!onVerifyPassword) {
      // 没有验证函数,直接删除
      if (confirm(`确定删除选中的 ${selectedCategories.size} 个分类吗?这些分类下的书签将移动到"常用推荐"。`)) {
        selectedCategories.forEach(id => onDeleteCategory(id));
        setSelectedCategories(new Set());
        setIsBatchMode(false);
      }
      return;
    }

    // 需要验证密码
    setPendingAction({
      type: 'batchDelete',
      categoryIds: Array.from(selectedCategories)
    });
    setIsAuthModalOpen(true);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
    }
    onUpdateCategories(newCats);
  };

  // 处理密码验证
  const handlePasswordVerification = async (password: string): Promise<boolean> => {
    if (!onVerifyPassword) return true; // 如果没有提供验证函数，默认通过
    
    try {
      const isValid = await onVerifyPassword(password);
      return isValid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  // 处理编辑分类前的验证
  const handleStartEdit = (cat: Category) => {
    if (!onVerifyPassword) {
      // 如果没有提供验证函数，直接编辑
      startEdit(cat);
      return;
    }

    // 设置待处理的操作
    setPendingAction({
      type: 'edit',
      categoryId: cat.id,
      categoryName: cat.name
    });
    
    // 打开验证弹窗
    setIsAuthModalOpen(true);
  };

  // 处理删除分类前的验证
  const handleDeleteClick = (cat: Category) => {
    if (!onVerifyPassword) {
      // 如果没有提供验证函数，直接删除
      if (confirm(`确定删除"${cat.name}"分类吗？该分类下的书签将移动到"常用推荐"。`)) {
        onDeleteCategory(cat.id);
      }
      return;
    }

    // 设置待处理的操作
    setPendingAction({
      type: 'delete',
      categoryId: cat.id,
      categoryName: cat.name
    });
    
    // 打开验证弹窗
    setIsAuthModalOpen(true);
  };

  // 处理验证成功后的操作
  const handleAuthSuccess = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'edit') {
      const cat = categories.find(c => c.id === pendingAction.categoryId);
      if (cat) {
        startEdit(cat);
      }
    } else if (pendingAction.type === 'delete') {
      const cat = categories.find(c => c.id === pendingAction.categoryId);
      if (cat && confirm(`确定删除"${cat.name}"分类吗？该分类下的书签将移动到"常用推荐"。`)) {
        onDeleteCategory(cat.id);
      }
    } else if (pendingAction.type === 'batchDelete' && pendingAction.categoryIds) {
      // 批量删除
      if (confirm(`确定删除选中的 ${pendingAction.categoryIds.length} 个分类吗？这些分类下的书签将移动到"常用推荐"。`)) {
        pendingAction.categoryIds.forEach(id => onDeleteCategory(id));
        setSelectedCategories(new Set());
        setIsBatchMode(false);
      }
    }

    // 清除待处理的操作
    setPendingAction(null);
  };

  // 处理验证弹窗关闭
  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditPassword(cat.password || '');
    setEditIcon(cat.icon);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const newCats = categories.map(c => c.id === editingId ? { 
        ...c, 
        name: editName.trim(),
        icon: editIcon,
        password: editPassword.trim() || undefined
    } : c);
    onUpdateCategories(newCats);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      icon: newCatIcon,
      password: newCatPassword.trim() || undefined
    };
    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatPassword('');
    setNewCatIcon('Folder');
  };

  const openIconSelector = (target: 'edit' | 'new') => {
    setIconSelectorTarget(target);
    setIsIconSelectorOpen(true);
  };
  
  const handleIconSelect = (iconName: string) => {
    if (iconSelectorTarget === 'edit') {
      setEditIcon(iconName);
    } else if (iconSelectorTarget === 'new') {
      setNewCatIcon(iconName);
    }
  };
  
  const cancelIconSelector = () => {
    setIsIconSelectorOpen(false);
    setIconSelectorTarget(null);
  };
  
  const cancelAdd = () => {
    setNewCatName('');
    setNewCatPassword('');
    setNewCatIcon('Folder');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white">分类管理</h3>
          <div className="flex items-center gap-2">
            {/* 多选模式切换按钮 */}
            <button
              onClick={toggleBatchMode}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isBatchMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {isBatchMode ? '取消多选' : '多选'}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X className="w-5 h-5 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* 多选模式工具栏 */}
        {isBatchMode && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {selectedCategories.size === categories.filter(c => c.id !== 'common').length ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
                <span>全选</span>
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                已选择 {selectedCategories.size} 个分类
              </span>
            </div>
            <button
              onClick={handleBatchDelete}
              disabled={selectedCategories.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <Trash2 size={14} />
              <span>删除选中</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {categories.map((cat, index) => (
            <div key={cat.id} className={`flex flex-col p-3 rounded-lg group gap-2 ${
              isBatchMode && selectedCategories.has(cat.id)
                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                : 'bg-slate-50 dark:bg-slate-700/50'
            }`}>
              <div className="flex items-center gap-2">
                  {/* 多选模式复选框 */}
                  {isBatchMode && (
                    <button
                      onClick={() => toggleCategorySelection(cat.id)}
                      disabled={cat.id === 'common'}
                      className="flex-shrink-0 p-1"
                    >
                      {cat.id === 'common' ? (
                        <Lock size={18} className="text-slate-300 dark:text-slate-600" />
                      ) : selectedCategories.has(cat.id) ? (
                        <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square size={18} className="text-slate-400 hover:text-blue-500" />
                      )}
                    </button>
                  )}

                  {/* Order Controls - 非多选模式显示 */}
                  {!isBatchMode && (
                    <div className="flex flex-col gap-1 mr-2">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {editingId === cat.id && cat.id !== 'common' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Icon name={editIcon} size={16} />
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 p-1.5 px-2 text-sm rounded border border-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                            placeholder="分类名称"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            onClick={() => openIconSelector('edit')}
                            title="选择图标"
                          >
                            <Palette size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-slate-400" />
                          <input 
                            type="password" 
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="flex-1 p-1.5 px-2 text-sm rounded border border-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                            placeholder="密码（可选）"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name={cat.icon} size={16} />
                        <span className="font-medium dark:text-slate-200 truncate">
                          {cat.name}
                          {cat.id === 'common' && (
                            <span className="ml-2 text-xs text-slate-400">(默认分类，不可编辑)</span>
                          )}
                        </span>
                        {cat.password && (
                          <Lock size={12} className="text-slate-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isBatchMode && (
                    <div className="flex items-center gap-1 self-start mt-1">
                      {editingId === cat.id ? (
                        <button onClick={saveEdit} className="text-green-500 hover:bg-green-50 dark:hover:bg-slate-600 p-1.5 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600"><Check size={16}/></button>
                      ) : (
                        <>
                          {cat.id !== 'common' && (
                            <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {/* 只有非"常用推荐"分类才显示删除按钮 */}
                          {cat.id !== 'common' && (
                            <button
                              onClick={() => handleDeleteClick(cat)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {/* "常用推荐"分类显示锁定图标 */}
                          {cat.id === 'common' && (
                            <div className="p-1.5 text-slate-300" title="常用推荐分类不能被删除">
                              <Lock size={14} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
           <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">添加新分类</label>
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
               <Icon name={newCatIcon} size={16} />
               <input 
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="分类名称"
                  className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
               <button
                 type="button"
                 className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                 onClick={() => openIconSelector('new')}
                 title="选择图标"
               >
                 <Palette size={16} />
               </button>
             </div>
             <div className="flex gap-2">
                 <div className="flex-1 relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        value={newCatPassword}
                        onChange={(e) => setNewCatPassword(e.target.value)}
                        placeholder="密码 (可选)"
                        className="w-full pl-8 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                 </div>
                 <button 
                    onClick={handleAdd}
                    disabled={!newCatName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                 >
                   <Plus size={18} />
                 </button>
             </div>
           </div>
          
          {/* 图标选择器弹窗 */}
          {isIconSelectorOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">选择图标</h3>
                  <button
                    type="button"
                    onClick={cancelIconSelector}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <IconSelector 
                    onSelectIcon={(iconName) => {
                      handleIconSelect(iconName);
                      setIsIconSelectorOpen(false);
                      setIconSelectorTarget(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 分类操作密码验证弹窗 */}
          {isAuthModalOpen && pendingAction && (
            <CategoryActionAuthModal
              isOpen={isAuthModalOpen}
              onClose={handleAuthModalClose}
              onVerify={handlePasswordVerification}
              onVerified={handleAuthSuccess}
              actionType={pendingAction.type}
              categoryName={pendingAction.categoryName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;