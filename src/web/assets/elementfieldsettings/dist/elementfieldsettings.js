!function(){var t;t=jQuery,Craft.ElementFieldSettings=Garnish.Base.extend({$relatedAncestorsInput:null,$sourcesInput:null,$branchLimitInput:null,$maxRelationsInput:null,$minRelationsInput:null,init:function(e,s,i,n,l){this.$relatedAncestorsInput=t("#"+e),this.$sourcesInput=t("#".concat(s)),this.$branchLimitInput=t("#"+i),this.$minRelationsInput=t("#"+n),this.$maxRelationsInput=t("#"+l),this.updateLimitFields(),this.addListener(this.$relatedAncestorsInput,"change","updateLimitFields"),this.$sourcesInput.length&&(this.updateRelateAncestorsField(),this.$sourcesInput.find("[type=checkbox]").each(function(e,s){this.addListener(t(s),"change","updateRelateAncestorsField")}.bind(this)))},updateLimitFields:function(){this.$relatedAncestorsInput.is(":checked")?(this.$minRelationsInput.closest(".field").hide(),this.$maxRelationsInput.closest(".field").hide(),this.$branchLimitInput.closest(".field").show()):(this.$branchLimitInput.closest(".field").hide(),this.$minRelationsInput.closest(".field").show(),this.$maxRelationsInput.closest(".field").show())},updateRelateAncestorsField:function(){var t=!1;this.$sourcesInput.find('[type="checkbox"]:checked').length>1&&(t=!0),t?(this.$relatedAncestorsInput.prop("disabled",!0),this.$relatedAncestorsInput.prop("checked",!1),this.$relatedAncestorsInput.trigger("change")):this.$relatedAncestorsInput.prop("disabled",!1)}})}();
//# sourceMappingURL=elementfieldsettings.js.map